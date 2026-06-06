import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Verify an hCaptcha token server-side.
 *
 * Set HCAPTCHA_SECRET in env.local.
 * If not configured, returns { ok: true } (dev bypass).
 */
export async function POST(req: Request) {
  const secret = process.env.HCAPTCHA_SECRET
  if (!secret) return NextResponse.json({ ok: true, bypassed: true })

  let body: { token?: string }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 }) }

  if (!body.token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 })

  const form = new URLSearchParams()
  form.set('secret',   secret)
  form.set('response', body.token)

  try {
    const r = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const data = await r.json() as { success: boolean; 'error-codes'?: string[] }
    if (!data.success) {
      return NextResponse.json({ ok: false, error: 'verification_failed', codes: data['error-codes'] }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
