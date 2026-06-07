'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function purchaseResellerV2(
  productIds: string[],
  cycle:      'monthly' | 'yearly' | 'lifetime',
  expectedCents: number,
): Promise<{ ok: boolean; error?: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  if (!productIds.length) return { ok: false, error: 'Pick at least one tool.' }
  if (productIds.length > 100) return { ok: false, error: 'Too many tools selected.' }

  const admin = supabaseAdmin()
  const { data: result, error } = await admin.rpc('purchase_reseller_v2', {
    p_user_id:       user.id,
    p_product_ids:   productIds,
    p_billing_cycle: cycle,
    p_paid_cents:    expectedCents,
  } as never)

  if (error) return { ok: false, error: error.message }

  const r = result as { ok: boolean; reason?: string; expected?: number; have?: number } | null
  if (!r?.ok) {
    if (r?.reason === 'insufficient_balance') return { ok: false, error: 'Insufficient wallet balance.' }
    if (r?.reason === 'price_mismatch') return { ok: false, error: 'Pricing changed — refresh and try again.' }
    if (r?.reason === 'no_tools_selected') return { ok: false, error: 'Pick at least one tool.' }
    return { ok: false, error: r?.reason ?? 'Purchase failed.' }
  }

  revalidatePath('/reseller')
  revalidatePath('/dashboard/applications')
  revalidatePath('/dashboard/resells')
  return { ok: true }
}
