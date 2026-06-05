import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/cron'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/cron/subscription-renewal
 * Runs daily at 03:00 UTC.
 *
 * Steps:
 *   1. Find subscriptions where next_billing_at is today and auto_renew=true
 *   2. For each: check user wallet balance >= amount
 *   3. Deduct balance, extend license expiry, advance next_billing_at
 *   4. If insufficient balance: mark subscription past_due
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  interface SubRow {
    id:               string
    user_id:          string
    license_id:       string
    amount_cents:     number
    interval_days:    number
    next_billing_at:  string
  }

  const { data: subs } = await db
    .from('subscriptions')
    .select('id, user_id, license_id, amount_cents, interval_days, next_billing_at')
    .eq('auto_renew', true)
    .eq('status', 'active')
    .lte('next_billing_at', tomorrow.toISOString())
    .returns<SubRow[]>()

  let renewed = 0
  let pastDue = 0

  for (const sub of (subs ?? [])) {
    interface UserBalRow { wallet_balance_cents: number }
    const { data: user } = await db
      .from('users')
      .select('wallet_balance_cents')
      .eq('id', sub.user_id)
      .single<UserBalRow>()

    if (!user || user.wallet_balance_cents < sub.amount_cents) {
      await db.from('subscriptions').update({ status: 'past_due' } as never).eq('id', sub.id)
      pastDue++
      continue
    }

    // Deduct balance + extend license + advance billing date — sequential, RPC would be atomic
    const newBalance = user.wallet_balance_cents - sub.amount_cents
    await db.from('users').update({ wallet_balance_cents: newBalance } as never).eq('id', sub.user_id)

    await db.from('wallet_transactions').insert({
      user_id:             sub.user_id,
      type:                'purchase',
      amount_cents:        -sub.amount_cents,
      balance_after_cents: newBalance,
      reference_id:        sub.id,
      note:                'Subscription auto-renewal',
    } as never)

    const newExpiry = new Date(now.getTime() + sub.interval_days * 24 * 60 * 60 * 1000)
    await db.from('licenses').update({ expires_at: newExpiry.toISOString() } as never).eq('id', sub.license_id)
    await db.from('subscriptions').update({ next_billing_at: newExpiry.toISOString() } as never).eq('id', sub.id)

    renewed++
  }

  return NextResponse.json({ ok: true, renewed, pastDue, checked: subs?.length ?? 0 })
}
