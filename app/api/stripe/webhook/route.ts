import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/server'
import { notifyNewSale } from '@/lib/discord-webhook'
import { emailWalletTopup } from '@/lib/email'
import { generateLicenseKey } from '@/lib/auth-engine'

interface PurchaseProfile { username: string; email: string; total_spent_cents: number }

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stripe webhook handler — credit wallets when checkout.session.completed.
 *
 * Configure your Stripe webhook to POST to:
 *   https://onxy.cc/api/stripe/webhook
 * with these events at minimum:
 *   - checkout.session.completed
 *
 * Idempotent: every Stripe event_id is recorded so we never double-credit.
 */
export async function POST(req: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid signature'
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 })
  }

  const admin = supabaseAdmin()

  // Idempotency: skip if event_id already seen
  const { data: existing } = await admin
    .from('admin_audit')
    .select('id')
    .eq('action', 'stripe_event')
    .eq('details->>event_id', event.id)
    .maybeSingle()
  if (existing) return NextResponse.json({ received: true, duplicate: true })

  // Process supported events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const kind     = session.metadata?.kind
      const userId   = session.metadata?.user_id
      const cents    = Number(session.metadata?.cents ?? 0)

      if (!userId || !cents || !kind) break

      if (kind === 'wallet_topup') {
        // Credit user wallet
        const { data: profRaw } = await admin
          .from('profiles').select('balance_cents, total_spent_cents').eq('id', userId).maybeSingle()
        const profile = profRaw as { balance_cents: number; total_spent_cents: number } | null
        if (!profile) break

        await admin.from('profiles')
          .update({ balance_cents: profile.balance_cents + cents } as never)
          .eq('id', userId)

        await admin.from('transactions').insert({
          user_id:      userId,
          type:         'stripe_topup',
          amount_cents: cents,
          description:  `Stripe wallet top-up · session ${session.id.slice(-8)}`,
          meta: {
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
            stripe_event_id: event.id,
          },
        } as never)

        await admin.from('notifications').insert({
          user_id:  userId,
          type:     'wallet_topup',
          title:    `Wallet credited $${(cents / 100).toFixed(2)}`,
          body:     'Your Stripe payment was successful. Funds are available immediately.',
          link_url: '/dashboard/balance',
        } as never)

        // Email + Discord fan-out (best effort)
        const { data: fullProfRaw } = await admin
          .from('profiles').select('username, email, total_spent_cents').eq('id', userId).maybeSingle()
        const fullProf = fullProfRaw as { username: string; email: string; total_spent_cents: number } | null
        if (fullProf) {
          // Bump total_spent_cents for reporting
          await admin.from('profiles')
            .update({ total_spent_cents: (fullProf.total_spent_cents ?? 0) + cents } as never)
            .eq('id', userId)
          await emailWalletTopup(fullProf.email, fullProf.username, cents)
          await notifyNewSale({
            user_username:    fullProf.username,
            user_email:       fullProf.email,
            amount_cents:     cents,
            description:      'Wallet top-up via Stripe',
            total_user_spent: (fullProf.total_spent_cents ?? 0) + cents,
          })
        }
      }

      if (kind === 'product_purchase') {
        const productId   = session.metadata?.product_id
        const productName = session.metadata?.product_name ?? 'product'
        const tier        = session.metadata?.tier ?? 'lifetime'
        if (!productId) break

        const durationDays = tier === 'day' ? 1 : tier === 'week' ? 7 : tier === 'month' ? 30 : null   // null = lifetime
        const now = new Date()
        const expiresAt = durationDays ? new Date(now.getTime() + durationDays * 86_400_000).toISOString() : null

        // Generate the key
        const keyFull = generateLicenseKey()
        const keyPrefix = keyFull.split('-').slice(0, 2).join('-')

        await admin.from('licenses').insert({
          user_id:        userId,
          product:        productName,
          product_id:     productId,
          key_full:       keyFull,
          key_prefix:     keyPrefix,
          status:         'active',
          duration_days:  durationDays,
          expires_at:     expiresAt,
        } as never)

        // Email + Discord + notification
        const { data: fullProfRaw2 } = await admin
          .from('profiles').select('username, email, total_spent_cents').eq('id', userId).maybeSingle()
        const fullProf2 = fullProfRaw2 as PurchaseProfile | null
        if (fullProf2) {
          await admin.from('profiles')
            .update({ total_spent_cents: (fullProf2.total_spent_cents ?? 0) + cents } as never)
            .eq('id', userId)
          await notifyNewSale({
            user_username:    fullProf2.username,
            user_email:       fullProf2.email,
            amount_cents:     cents,
            description:      `Purchased ${productName} (${tier})`,
            total_user_spent: (fullProf2.total_spent_cents ?? 0) + cents,
          })
        }

        await admin.from('notifications').insert({
          user_id:  userId,
          type:     'purchase_complete',
          title:    `${productName} — ${tier} key delivered`,
          body:     `Your new license is in /dashboard/licenses. Key starts with ${keyPrefix}.`,
          link_url: '/dashboard/licenses',
        } as never)
      }

      break
    }

    default:
      // Ignore unhandled event types
      break
  }

  // Record event id for idempotency
  await admin.from('admin_audit').insert({
    admin_id: null,
    target_id: null,
    action: 'stripe_event',
    details: { event_id: event.id, type: event.type },
  } as never)

  return NextResponse.json({ received: true })
}
