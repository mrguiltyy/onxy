import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { stripe, SITE_URL, isStripeConfigured } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Create a Stripe Checkout Session for wallet top-up.
 *
 * Body: { cents: number }   — amount to top up in cents (min $5, max $5000)
 * Returns: { url: string }  — redirect target
 */
export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Payments not configured. Contact admin.' }, { status: 503 })
  }

  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  let body: { cents?: number }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request.' }, { status: 400 }) }

  const cents = Math.floor(Number(body.cents ?? 0))
  if (!Number.isFinite(cents) || cents < 500)      return NextResponse.json({ error: 'Minimum top-up is $5.00.' }, { status: 400 })
  if (cents > 500_000)                              return NextResponse.json({ error: 'Maximum single top-up is $5,000.' }, { status: 400 })

  const s = stripe()
  const session = await s.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name:        'OP wallet top-up',
          description: `Add $${(cents / 100).toFixed(2)} to your OP wallet`,
        },
        unit_amount: cents,
      },
      quantity: 1,
    }],
    metadata: {
      user_id:    user.id,
      kind:       'wallet_topup',
      cents:      String(cents),
    },
    success_url: `${SITE_URL}/dashboard/balance?topup=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${SITE_URL}/dashboard/balance?topup=cancel`,
  })

  return NextResponse.json({ url: session.url })
}
