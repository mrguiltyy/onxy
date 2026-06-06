'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

interface Profile { role: string }
interface Product { id: string; reseller_open: boolean; reseller_auto_approve: boolean }

export async function submitResellApplication(
  productId: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const customName  = String(formData.get('custom_name') ?? '').trim()
  const customImage = String(formData.get('custom_image') ?? '').trim() || null
  const pitch       = String(formData.get('pitch') ?? '').trim()

  if (!customName || customName.length < 2 || customName.length > 80) {
    return { ok: false, error: 'Branded name must be 2–80 characters.' }
  }
  if (!pitch || pitch.length < 20 || pitch.length > 1000) {
    return { ok: false, error: 'Pitch must be 20–1000 characters.' }
  }
  if (customImage && customImage.length > 400) {
    return { ok: false, error: 'Image URL too long.' }
  }

  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  // Role gate — must be reseller or admin
  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'reseller' && role !== 'super_admin') {
    return { ok: false, error: 'Reseller access required. Apply for reseller status first.' }
  }

  const admin = supabaseAdmin()

  // Verify product is active and reseller-open
  const { data: prodRaw } = await admin
    .from('products')
    .select('id, reseller_open, reseller_auto_approve')
    .eq('id', productId).eq('status', 'active').maybeSingle()
  const product = prodRaw as Product | null
  if (!product) return { ok: false, error: 'Product not available.' }
  if (!product.reseller_open) return { ok: false, error: 'This product is not currently accepting new resellers.' }

  // Insert (or fail on unique violation)
  const status = product.reseller_auto_approve ? 'approved' : 'pending'
  const { error } = await admin.from('reseller_grants')
    .insert({
      product_id:  product.id,
      reseller_id: user.id,
      status,
      custom_name: customName,
      custom_image: customImage,
      pitch,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
    } as never)

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'You’ve already applied to resell this product.' }
    return { ok: false, error: error.message }
  }

  // Auto-create a notification for the admin team (best effort)
  // (we use the super_admin profiles as recipients)
  if (status === 'pending') {
    const { data: admins } = await admin.from('profiles').select('id').eq('role', 'super_admin')
    if (admins) {
      const rows = (admins as { id: string }[]).map(a => ({
        user_id:  a.id,
        type:     'reseller_application',
        title:    `New reseller application: ${customName}`,
        body:     pitch.slice(0, 240),
        link_url: '/admin/resellers',
      }))
      if (rows.length) await admin.from('notifications').insert(rows as never)
    }
  } else {
    // Auto-approved → notify the reseller
    await admin.from('notifications').insert({
      user_id:  user.id,
      type:     'reseller_approved',
      title:    `Approved to resell ${customName}`,
      body:     'You can now generate keys for this product at wholesale.',
      link_url: '/dashboard/resells',
    } as never)
  }

  revalidatePath('/products')
  revalidatePath(`/products/[slug]`)
  return { ok: true }
}
