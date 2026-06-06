'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { generateAppId, generateAppSecret, sha256 } from '@/lib/auth-engine'

interface Profile { role: string }

interface CreateAppResult {
  ok: boolean
  error?: string
  // shown ONCE then thrown away
  app_id?: string
  app_secret?: string
  application_id?: string
  name?: string
}

export async function createApplication(formData: FormData): Promise<CreateAppResult> {
  const name        = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const version     = String(formData.get('version') ?? '1.0.0').trim() || '1.0.0'
  const hwidLock    = formData.get('hwid_lock') === 'on'
  const versionCheck = formData.get('version_check') === 'on'

  if (!name || name.length < 2 || name.length > 80) {
    return { ok: false, error: 'Name must be 2–80 characters.' }
  }

  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  // Role gate
  const { data: pRaw } = await supa
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'super_admin' && role !== 'reseller') {
    return { ok: false, error: 'Reseller access required.' }
  }

  // Generate credentials — secret is shown ONCE then only hashed in DB
  const appId      = generateAppId()
  const appSecret  = generateAppSecret()
  const secretHash = sha256(appSecret)

  const admin = supabaseAdmin()
  const { data: insertedRaw, error } = await admin.from('applications')
    .insert({
      owner_id:      user.id,
      app_id:        appId,
      name,
      description,
      secret_hash:   secretHash,
      version,
      hwid_lock:     hwidLock,
      version_check: versionCheck,
    } as never)
    .select('id')
    .single()

  if (error || !insertedRaw) {
    return { ok: false, error: error?.message ?? 'Failed to create application.' }
  }
  const inserted = insertedRaw as { id: string }

  revalidatePath('/dashboard/applications')
  return {
    ok: true,
    app_id: appId,
    app_secret: appSecret,
    application_id: inserted.id,
    name,
  }
}

export async function toggleAppStatus(applicationId: string, newStatus: 'active' | 'paused') {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return

  // RLS ensures only owner can update
  await supa.from('applications')
    .update({ status: newStatus } as never)
    .eq('id', applicationId)

  revalidatePath(`/dashboard/applications/${applicationId}`)
  revalidatePath('/dashboard/applications')
}

export async function deleteApplication(applicationId: string) {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return

  await supa.from('applications').delete().eq('id', applicationId)

  revalidatePath('/dashboard/applications')
  redirect('/dashboard/applications')
}

export async function rotateAppSecret(applicationId: string): Promise<{ ok: boolean; app_secret?: string; error?: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const newSecret = generateAppSecret()
  const newHash = sha256(newSecret)

  const { error } = await supa.from('applications')
    .update({ secret_hash: newHash } as never)
    .eq('id', applicationId)
    .eq('owner_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/dashboard/applications/${applicationId}`)
  return { ok: true, app_secret: newSecret }
}
