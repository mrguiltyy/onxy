import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/redeem
 *
 * Demo handler — replace with real database lookup + transaction.
 * For now, simulates the same logic the UI demos.
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ ok: false, code: 'BAD_REQUEST', reason: 'Missing code.' }, { status: 400 })
    }

    const upper = code.trim().toUpperCase()

    // Demo lookup — replace with real DB query
    if (upper === 'INVALID') {
      return NextResponse.json({ ok: false, code: 'CODE_NOT_FOUND', reason: "That code doesn't exist." })
    }
    if (upper === 'EXPIRED') {
      return NextResponse.json({ ok: false, code: 'CODE_EXPIRED', reason: 'This code has expired.' })
    }
    if (upper === 'USED') {
      return NextResponse.json({ ok: false, code: 'ALREADY_REDEEMED', reason: 'You already redeemed this code.' })
    }
    if (upper === 'EXHAUSTED') {
      return NextResponse.json({ ok: false, code: 'CODE_EXHAUSTED', reason: 'This code has reached its usage limit.' })
    }

    // Success cases
    if (upper.startsWith('CREDIT')) {
      return NextResponse.json({
        ok: true,
        reward: 'credit',
        credit: { amount: 2500, newBalance: 16750 },
      })
    }
    if (upper.startsWith('DISCOUNT')) {
      return NextResponse.json({
        ok: true,
        reward: 'discount',
        discount: { percentOff: 20, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
      })
    }

    // Default: grant a license
    return NextResponse.json({
      ok: true,
      reward: 'license',
      license: {
        key:       `ONYX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        product:   'Onyx Core',
        duration:  '7 days',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ ok: false, code: 'SERVER_ERROR', reason: 'Something went wrong.' }, { status: 500 })
  }
}
