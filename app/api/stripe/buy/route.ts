import { NextResponse } from 'next/server'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { stripe, SITE_URL, isStripeConfigured } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Product {
  id:             string
  slug:           string
  name:           string
  status:         string
  price_day:      number | null
  price_week:     number | null
  price_month:    number | null
  price_lifetime: number | null
}

/**
 * Create a Stripe Checkout Session for a direct product purchase.
 *
 * Body: { product_id: string; tier: 'day'|'week'|'month'|'lifetime' }
 * Returns: { url: string }
 *
 * On checkout completion, the webhook generates a license key bound to the buyer.
 */
export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Payments not configured.' }, { status: 503 })
  }

  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to buy.' }, { status: 401 })

  let body: { product_id?: string; tier?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request.' }, { status: 400 }) }

  const productId = body.product_id
  const tier = body.tier
  if (!productId) return NextResponse.json({ error: 'product_id required.' }, { status: 400 })
  if (!tier || !['day','week','month','lifetime'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier.' }, { status: 400 })
  }
  // tier is now narrowed to a non-empty string

  const admin = supabaseAdmin()
  const { data: pRaw } = await admin
    .from('products')
    .select('id, slug, name, status, price_day, price_week, price_month, price_lifetime')
    .eq('id', productId)
    .maybeSingle()
  const product = pRaw as Product | null
  if (!product || product.status !== 'active') {
    return NextResponse.json({ error: 'Product not available.' }, { status: 404 })
  }

  const priceMap = {
    day:      product.price_day,
    week:     product.price_week,
    month:    product.price_month,
    lifetime: product.price_lifetime,
  }
  const cents = priceMap[tier as keyof typeof priceMap]
  if (cents == null || cents < 50) {
    return NextResponse.json({ error: 'This tier is not offered for this product.' }, { status: 400 })
  }

  const tierLabel = tier === 'lifetime' ? 'Lifetime' : `1 ${tier}`
  const s = stripe()
  const session = await s.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${product.name} — ${tierLabel}`,
          description: `License for ${product.name}, delivered instantly.`,
        },
        unit_amount: cents,
      },
      quantity: 1,
    }],
    metadata: {
      user_id:    user.id,
      kind:       'product_purchase',
      product_id: product.id,
      product_name: product.name,
      tier,
      cents:      String(cents),
    },
    success_url: `${SITE_URL}/dashboard/licenses?bought=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${SITE_URL}/products/${product.slug}?bought=cancel`,
  })

  return NextResponse.json({ url: session.url })
}
