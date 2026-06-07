import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyIpnSignature } from '@/lib/nowpayments'
import { notifyNewSale } from '@/lib/discord-webhook'
import { emailWalletTopup } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface IpnPayload {
  payment_id:     string | number
  payment_status: string             // 'waiting' | 'confirming' | 'confirmed' | 'finished' | 'failed' | 'refunded' | 'expired'
  order_id:       string
  price_amount:   number
  price_currency: string             // 'usd' usually
  pay_amount:     number
  pay_currency:   string
  actually_paid?: number
  outcome_amount?: number
  outcome_currency?: string
}

interface PendingTx {
  id:           string
  user_id:      string
  type:         string
  description:  string | null
  meta:         { kind?: string; cents?: number; order_id?: string; payment_id?: string | number; pay_currency?: string } | null
}

interface UserProfile {
  username:          string
  email:             string
  balance_cents:     number
  total_spent_cents: number
}

/**
 * NOWPayments IPN handler.
 * Verifies the HMAC-SHA512 signature, then credits the user's wallet
 * (idempotently, via order_id de-duplication).
 */
export async function POST(req: Request) {
  const rawBody   = await req.text()
  const signature = req.headers.get('x-nowpayments-sig')

  if (!verifyIpnSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let payload: IpnPayload
  try { payload = JSON.parse(rawBody) as IpnPayload } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  // Only care about successful states. NOWPayments fires multiple webhooks
  // (waiting → confirming → confirmed → finished). We act on 'finished'.
  if (payload.payment_status !== 'finished' && payload.payment_status !== 'confirmed') {
    return NextResponse.json({ ok: true, ignored: payload.payment_status })
  }

  const admin = supabaseAdmin()

  // Find the pending transaction by order_id
  const { data: pendingRaw } = await admin
    .from('transactions')
    .select('id, user_id, type, description, meta')
    .eq('type', 'crypto_pending')
    .filter('meta->>order_id', 'eq', payload.order_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const pending = pendingRaw as PendingTx | null
  if (!pending) {
    // Either already credited or unknown — be lenient (idempotent)
    return NextResponse.json({ ok: true, note: 'order not pending' })
  }

  const cents = pending.meta?.cents ?? Math.round((payload.price_amount ?? 0) * 100)
  if (!cents || cents < 1) {
    return NextResponse.json({ error: 'no amount' }, { status: 400 })
  }

  // Atomic-ish: update profile + flip transaction type from crypto_pending → crypto_topup
  const { data: profRaw } = await admin
    .from('profiles').select('username, email, balance_cents, total_spent_cents').eq('id', pending.user_id).maybeSingle()
  const prof = profRaw as UserProfile | null
  if (!prof) return NextResponse.json({ error: 'user missing' }, { status: 404 })

  // Credit wallet
  await admin.from('profiles')
    .update({
      balance_cents:     prof.balance_cents + cents,
      total_spent_cents: (prof.total_spent_cents ?? 0) + cents,
    } as never)
    .eq('id', pending.user_id)

  // Flip the pending transaction to the real type
  await admin.from('transactions')
    .update({
      type:         'crypto_topup',
      amount_cents: cents,
      description:  `Crypto top-up · ${payload.pay_currency?.toUpperCase()} · confirmed`,
      meta: {
        ...(pending.meta ?? {}),
        payment_status:    payload.payment_status,
        actually_paid:     payload.actually_paid,
        outcome_amount:    payload.outcome_amount,
        outcome_currency:  payload.outcome_currency,
      },
    } as never)
    .eq('id', pending.id)

  // Notification
  await admin.from('notifications').insert({
    user_id:  pending.user_id,
    type:     'wallet_topup',
    title:    `Wallet credited $${(cents / 100).toFixed(2)}`,
    body:     `Your ${payload.pay_currency?.toUpperCase()} payment was confirmed.`,
    link_url: '/dashboard/balance',
  } as never)

  // Best-effort fan-out
  await emailWalletTopup(prof.email, prof.username, cents)
  await notifyNewSale({
    user_username:    prof.username,
    user_email:       prof.email,
    amount_cents:     cents,
    description:      `Wallet top-up via crypto (${payload.pay_currency?.toUpperCase()})`,
    total_user_spent: (prof.total_spent_cents ?? 0) + cents,
  })

  return NextResponse.json({ ok: true, credited_cents: cents })
}
