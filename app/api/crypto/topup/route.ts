import { NextResponse } from 'next/server'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { createPayment, isCryptoConfigured, SUPPORTED_CRYPTO } from '@/lib/nowpayments'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Create a crypto wallet top-up payment.
 *
 * Body: { cents: number; pay_currency: string }
 * Returns: { ok: true, payment } so the client can render the pay page.
 */
export async function POST(req: Request) {
  if (!isCryptoConfigured()) {
    return NextResponse.json({ error: 'Crypto payments not configured.' }, { status: 503 })
  }

  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  let body: { cents?: number; pay_currency?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request.' }, { status: 400 }) }

  const cents = Math.floor(Number(body.cents ?? 0))
  if (!Number.isFinite(cents) || cents < 500) return NextResponse.json({ error: 'Minimum top-up is $5.00.' }, { status: 400 })
  if (cents > 500_000)                          return NextResponse.json({ error: 'Maximum single top-up is $5,000.' }, { status: 400 })

  const cur = String(body.pay_currency ?? '').toLowerCase()
  const supported = SUPPORTED_CRYPTO.find(c => c.code === cur)
  if (!supported) return NextResponse.json({ error: 'Unsupported currency.' }, { status: 400 })

  // Compose a unique order_id so we can match the IPN later
  const usd = cents / 100
  const orderId = `op_topup_${user.id.slice(0, 8)}_${Date.now()}`

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onxy.cc'
  const created = await createPayment({
    price_amount:     usd,
    pay_currency:     cur,
    order_id:         orderId,
    order_description: `OP wallet top-up · ${user.email}`,
    ipn_callback_url: `${site}/api/crypto/webhook`,
    success_url:      `${site}/dashboard/balance?topup=success`,
    cancel_url:       `${site}/dashboard/balance?topup=cancel`,
  })
  if (!created.ok) return NextResponse.json({ error: created.error }, { status: 502 })

  // Persist a pending transaction so we can correlate the IPN
  const admin = supabaseAdmin()
  await admin.from('transactions').insert({
    user_id:      user.id,
    type:         'crypto_pending',
    amount_cents: 0,                                  // 0 until confirmed
    description:  `Crypto top-up pending · ${cur.toUpperCase()} · order ${orderId}`,
    meta: {
      kind:           'crypto_topup',
      cents:          cents,
      order_id:       orderId,
      payment_id:     created.data.payment_id,
      pay_currency:   cur,
      pay_address:    created.data.pay_address,
      pay_amount:     created.data.pay_amount,
      expires_at:     created.data.expiration_estimate_date,
    },
  } as never)

  return NextResponse.json({ ok: true, payment: created.data, order_id: orderId })
}
