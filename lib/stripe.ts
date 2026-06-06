import Stripe from 'stripe'

/**
 * Server-side Stripe client.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY              - sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET          - whsec_... (from Stripe dashboard webhook)
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - pk_live_... or pk_test_... (used client-side)
 *
 * Optional:
 *   NEXT_PUBLIC_SITE_URL — base URL for success/cancel redirects (defaults to https://onxy.cc)
 */
let _stripe: Stripe | null = null

export function stripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  _stripe = new Stripe(key, {
    typescript: true,
  })
  return _stripe
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onxy.cc'

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
}
