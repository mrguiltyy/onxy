'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

interface Plan {
  id:                   string
  price_lifetime_cents: number | null
  price_monthly_cents:  number | null
  price_yearly_cents:   number | null
  active:               boolean
}

interface Profile { balance_cents: number; role: string }

export async function purchaseResellerPlan(
  planId:  string,
  cycle:   'lifetime' | 'monthly' | 'yearly',
  expectedCents: number,
): Promise<{ ok: boolean; error?: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const admin = supabaseAdmin()

  // Re-fetch the plan price server-side to avoid client tampering
  const { data: pRaw } = await admin
    .from('reseller_plans')
    .select('id, price_lifetime_cents, price_monthly_cents, price_yearly_cents, active')
    .eq('id', planId)
    .maybeSingle()
  const plan = pRaw as Plan | null
  if (!plan || !plan.active) return { ok: false, error: 'Plan not available.' }

  const truePrice = cycle === 'lifetime' ? plan.price_lifetime_cents
                  : cycle === 'monthly'  ? plan.price_monthly_cents
                  : plan.price_yearly_cents
  if (truePrice == null) return { ok: false, error: 'This billing cycle is not offered for this plan.' }

  // Sanity check expected vs actual
  if (Math.abs(truePrice - expectedCents) > 1) {
    return { ok: false, error: 'Price changed — refresh and try again.' }
  }

  // Verify balance
  const { data: profRaw } = await admin
    .from('profiles').select('balance_cents, role').eq('id', user.id).maybeSingle()
  const profile = profRaw as Profile | null
  if (!profile) return { ok: false, error: 'Profile missing.' }
  if (profile.balance_cents < truePrice) {
    return { ok: false, error: 'Insufficient wallet balance. Top up first.' }
  }

  // Atomic purchase via RPC
  const { data: result, error } = await admin.rpc('purchase_reseller_plan', {
    p_user_id:      user.id,
    p_plan_id:      planId,
    p_billing_cycle: cycle,
    p_paid_cents:   truePrice,
  } as never)

  if (error) return { ok: false, error: error.message }

  const r = result as { ok: boolean; reason?: string } | null
  if (!r?.ok) return { ok: false, error: r?.reason ?? 'Purchase failed.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/applications')
  revalidatePath('/reseller')
  return { ok: true }
}
