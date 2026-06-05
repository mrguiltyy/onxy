import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/reseller/generate
 *
 * Body: { productSlug, planId, quantity }
 * Auth: requires reseller role (TODO: enforce via session)
 *
 * Demo handler — replace inner block with:
 *   1. Verify user is reseller + not banned
 *   2. Look up product + plan retail price
 *   3. Compute discounted cost (retail * (1 - discount_percent / 100))
 *   4. Atomic: deduct wallet, generate N unique keys, insert into reseller_keys
 *   5. Log to wallet_transactions
 *   6. Return generated keys
 */

const DEFAULT_DISCOUNT = 75

export async function POST(req: NextRequest) {
  try {
    const { productSlug, planId, quantity } = await req.json()

    if (!productSlug || !planId || !quantity || quantity < 1 || quantity > 1000) {
      return NextResponse.json({ ok: false, code: 'BAD_REQUEST', reason: 'Invalid input.' }, { status: 400 })
    }

    // Demo: hardcoded retail price (replace with DB lookup)
    const retail = 999    // cents
    const unitCost = Math.round(retail * (1 - DEFAULT_DISCOUNT / 100))
    const totalCost = unitCost * quantity

    // TODO: deduct wallet balance, insert reseller_keys rows

    const keys = Array.from({ length: quantity }, () => {
      const seg = () => Math.random().toString(36).toUpperCase().slice(2, 6)
      return `ONYX-${seg()}-${seg()}-${seg()}-${seg()}`
    })

    return NextResponse.json({
      ok: true,
      keys,
      summary: {
        quantity,
        unitCost,
        totalCost,
        discountPercent: DEFAULT_DISCOUNT,
        retailPrice: retail,
        maxProfit: (retail - unitCost) * quantity,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, code: 'SERVER_ERROR', reason: 'Something went wrong.' }, { status: 500 })
  }
}
