'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

interface Profile { role: string }

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function parsePriceCents(value: FormDataEntryValue | null): number | null {
  if (value === null) return null
  const s = String(value).trim()
  if (!s) return null
  const dollars = parseFloat(s)
  if (Number.isNaN(dollars) || dollars < 0) return null
  return Math.round(dollars * 100)
}

async function gateAdmin() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not signed in.' }
  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'super_admin') return { ok: false as const, error: 'Admin only.' }
  return { ok: true as const, userId: user.id }
}

export async function createProduct(formData: FormData): Promise<{ ok: boolean; id?: string; error?: string }> {
  const gate = await gateAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  const name        = String(formData.get('name') ?? '').trim()
  const tagline     = String(formData.get('tagline') ?? '').trim() || null
  const description = String(formData.get('description') ?? '').trim() || null
  const imageUrl    = String(formData.get('image_url') ?? '').trim() || null
  const category    = String(formData.get('category') ?? 'tool').trim() || 'tool'
  const version     = String(formData.get('version') ?? '1.0.0').trim() || '1.0.0'
  const featured    = formData.get('featured') === 'on'
  const featuresRaw = String(formData.get('features') ?? '').trim()
  const features    = featuresRaw ? featuresRaw.split('\n').map(s => s.trim()).filter(Boolean) : []

  if (!name) return { ok: false, error: 'Name required.' }
  const slug = slugify(name)
  if (!slug) return { ok: false, error: 'Could not derive a URL slug from name.' }

  const admin = supabaseAdmin()
  const { data: insRaw, error } = await admin.from('products')
    .insert({
      slug, name, tagline, description, image_url: imageUrl, category, version,
      featured, features,
      price_day:      parsePriceCents(formData.get('price_day')),
      price_week:     parsePriceCents(formData.get('price_week')),
      price_month:    parsePriceCents(formData.get('price_month')),
      price_lifetime: parsePriceCents(formData.get('price_lifetime')),
      reseller_price_day:      parsePriceCents(formData.get('reseller_price_day')),
      reseller_price_week:     parsePriceCents(formData.get('reseller_price_week')),
      reseller_price_month:    parsePriceCents(formData.get('reseller_price_month')),
      reseller_price_lifetime: parsePriceCents(formData.get('reseller_price_lifetime')),
      reseller_open: formData.get('reseller_open') === 'on',
      reseller_auto_approve: formData.get('reseller_auto_approve') === 'on',
      lifetime_support: formData.get('lifetime_support') === 'on',
    } as never)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { ok: false, error: `A product with slug "${slug}" already exists.` }
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/products')
  revalidatePath('/products')
  return { ok: true, id: (insRaw as { id: string }).id }
}

export async function updateProduct(productId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const gate = await gateAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  const name        = String(formData.get('name') ?? '').trim()
  if (!name) return { ok: false, error: 'Name required.' }

  const tagline     = String(formData.get('tagline') ?? '').trim() || null
  const description = String(formData.get('description') ?? '').trim() || null
  const imageUrl    = String(formData.get('image_url') ?? '').trim() || null
  const category    = String(formData.get('category') ?? 'tool').trim() || 'tool'
  const version     = String(formData.get('version') ?? '1.0.0').trim() || '1.0.0'
  const status      = String(formData.get('status') ?? 'active').trim() || 'active'
  const featured    = formData.get('featured') === 'on'
  const featuresRaw = String(formData.get('features') ?? '').trim()
  const features    = featuresRaw ? featuresRaw.split('\n').map(s => s.trim()).filter(Boolean) : []

  const admin = supabaseAdmin()
  const { error } = await admin.from('products')
    .update({
      name, tagline, description, image_url: imageUrl, category, version, status,
      featured, features,
      price_day:      parsePriceCents(formData.get('price_day')),
      price_week:     parsePriceCents(formData.get('price_week')),
      price_month:    parsePriceCents(formData.get('price_month')),
      price_lifetime: parsePriceCents(formData.get('price_lifetime')),
      reseller_price_day:      parsePriceCents(formData.get('reseller_price_day')),
      reseller_price_week:     parsePriceCents(formData.get('reseller_price_week')),
      reseller_price_month:    parsePriceCents(formData.get('reseller_price_month')),
      reseller_price_lifetime: parsePriceCents(formData.get('reseller_price_lifetime')),
      reseller_open: formData.get('reseller_open') === 'on',
      reseller_auto_approve: formData.get('reseller_auto_approve') === 'on',
      lifetime_support: formData.get('lifetime_support') === 'on',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', productId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/products')
  return { ok: true }
}

export async function publishProductUpdate(productId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const gate = await gateAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  const version  = String(formData.get('version') ?? '').trim()
  const title    = String(formData.get('title') ?? '').trim()
  const notes    = String(formData.get('notes') ?? '').trim() || null
  const severity = String(formData.get('severity') ?? 'minor').trim()

  if (!version || !title) return { ok: false, error: 'Version and title required.' }
  if (!['patch', 'minor', 'major', 'breaking'].includes(severity)) {
    return { ok: false, error: 'Invalid severity.' }
  }

  const admin = supabaseAdmin()
  const { error } = await admin.from('product_updates').insert({
    product_id: productId, version, title, notes, severity, created_by: gate.userId,
  } as never)
  if (error) return { ok: false, error: error.message }

  // Bump product version (fan-out happens via trigger)
  await admin.from('products').update({ version, updated_at: new Date().toISOString() } as never).eq('id', productId)

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/products')
  return { ok: true }
}

export async function approveResellerGrant(grantId: string, discountPct = 0): Promise<{ ok: boolean; error?: string }> {
  const gate = await gateAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  const admin = supabaseAdmin()
  const { data: gRaw, error: gErr } = await admin
    .from('reseller_grants')
    .update({ status: 'approved', approved_by: gate.userId, approved_at: new Date().toISOString(), discount_pct: Math.max(0, Math.min(100, Math.round(discountPct))) } as never)
    .eq('id', grantId)
    .select('reseller_id, custom_name, product_id')
    .single()
  if (gErr) return { ok: false, error: gErr.message }

  const g = gRaw as { reseller_id: string; custom_name: string; product_id: string }
  await admin.from('notifications').insert({
    user_id:  g.reseller_id,
    type:     'reseller_approved',
    title:    `Approved to resell ${g.custom_name}`,
    body:     'You can now generate keys for this product at wholesale.',
    link_url: '/dashboard/resells',
  } as never)

  revalidatePath('/admin/resellers')
  revalidatePath('/dashboard/resells')
  return { ok: true }
}

export async function rejectResellerGrant(grantId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const gate = await gateAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  const admin = supabaseAdmin()
  const { data: gRaw, error: gErr } = await admin
    .from('reseller_grants')
    .update({ status: 'rejected', rejected_reason: reason.slice(0, 500) } as never)
    .eq('id', grantId)
    .select('reseller_id, custom_name')
    .single()
  if (gErr) return { ok: false, error: gErr.message }

  const g = gRaw as { reseller_id: string; custom_name: string }
  await admin.from('notifications').insert({
    user_id:  g.reseller_id,
    type:     'reseller_rejected',
    title:    `Application rejected: ${g.custom_name}`,
    body:     reason || 'See application for details.',
    link_url: '/dashboard/resells',
  } as never)

  revalidatePath('/admin/resellers')
  return { ok: true }
}

export async function deleteProduct(productId: string) {
  const gate = await gateAdmin()
  if (!gate.ok) return

  const admin = supabaseAdmin()
  await admin.from('products').delete().eq('id', productId)

  revalidatePath('/admin/products')
  revalidatePath('/products')
  redirect('/admin/products')
}
