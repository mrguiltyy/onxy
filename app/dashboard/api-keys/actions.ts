'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { generateSellerKey, hashSecret } from '@/lib/seller-keys'

interface Profile { role: string }

async function gateReseller() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not signed in.' }
  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'reseller' && role !== 'super_admin') {
    return { ok: false as const, error: 'Reseller access required.' }
  }
  return { ok: true as const, userId: user.id }
}

export async function createApiKey(name: string): Promise<{ ok: boolean; fullKey?: string; error?: string }> {
  const gate = await gateReseller()
  if (!gate.ok) return { ok: false, error: gate.error }

  if (!name || name.length < 1) return { ok: false, error: 'Name required.' }

  const generated = generateSellerKey()
  const hash = hashSecret(generated.secret)

  const admin = supabaseAdmin()
  const { error } = await admin.from('seller_keys').insert({
    user_id:    gate.userId,
    key_prefix: generated.prefix,
    key_hash:   hash,
    name:       name.slice(0, 80),
    active:     true,
  } as never)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/api-keys')
  return { ok: true, fullKey: generated.full }
}

export async function deleteApiKey(keyId: string): Promise<{ ok: boolean; error?: string }> {
  const gate = await gateReseller()
  if (!gate.ok) return { ok: false, error: gate.error }

  const admin = supabaseAdmin()
  const { error } = await admin.from('seller_keys').delete().eq('id', keyId).eq('user_id', gate.userId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard/api-keys')
  return { ok: true }
}
