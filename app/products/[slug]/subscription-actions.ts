'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function purchaseSubscription(
  productId: string,
  durationKey: '1d' | '7d' | '30d' | 'lifetime',
  expectedCents: number,
): Promise<{ ok: boolean; expiresAt?: string | null; extended?: boolean; error?: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Sign in first.' }

  if (!['1d', '7d', '30d', 'lifetime'].includes(durationKey)) {
    return { ok: false, error: 'Invalid duration.' }
  }

  const admin = supabaseAdmin()

  // Server-side price double-check (anti-tampering)
  const { data: prodRaw } = await admin
    .from('products')
    .select('price_day, price_week, price_month, price_lifetime, status')
    .eq('id', productId).maybeSingle()
  const product = prodRaw as { price_day: number | null; price_week: number | null; price_month: number | null; price_lifetime: number | null; status: string } | null
  if (!product || product.status !== 'active') return { ok: false, error: 'Product not available.' }

  const truePrice =
    durationKey === '1d'       ? product.price_day :
    durationKey === '7d'       ? product.price_week :
    durationKey === '30d'      ? product.price_month :
                                 product.price_lifetime

  if (truePrice == null || truePrice <= 0) {
    return { ok: false, error: 'This duration is not offered.' }
  }
  if (Math.abs(truePrice - expectedCents) > 1) {
    return { ok: false, error: 'Price changed — refresh and try again.' }
  }

  // Atomic purchase via RPC
  const { data: result, error } = await admin.rpc('purchase_subscription', {
    p_user_id:      user.id,
    p_product_id:   productId,
    p_duration_key: durationKey,
  } as never)

  if (error) return { ok: false, error: error.message }

  const r = result as {
    ok: boolean
    reason?: string
    message?: string
    needed?: number
    have?: number
    expires_at?: string | null
    extended?: boolean
  } | null

  if (!r?.ok) {
    if (r?.reason === 'insufficient_balance') {
      return { ok: false, error: 'Insufficient wallet balance.' }
    }
    if (r?.reason === 'tier_not_available') {
      return { ok: false, error: r.message ?? 'This tier is not offered.' }
    }
    if (r?.reason === 'product_not_found') {
      return { ok: false, error: 'Product not available.' }
    }
    return { ok: false, error: r?.reason ?? 'Purchase failed.' }
  }

  revalidatePath(`/products/${productId}`)
  revalidatePath('/dashboard/subscriptions')
  revalidatePath('/dashboard')

  return {
    ok: true,
    expiresAt: r.expires_at ?? null,
    extended:  !!r.extended,
  }
}
