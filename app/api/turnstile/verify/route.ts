import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Verify a Cloudflare Turnstile token server-side.
 *
 * Set TURNSTILE_SECRET_KEY in env.local.
 * If not configured, returns { ok: true } (bypass).
 */
export async function POST(req: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return NextResponse.json({ ok: true, bypassed: true })

  let body: { token?: string }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 }) }

  if (!body.token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 })

  // Resolve client IP for additional verification
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
          ?? req.headers.get('cf-connecting-ip')
          ?? req.headers.get('x-real-ip')
          ?? undefined

  const form = new URLSearchParams()
  form.set('secret',   secret)
  form.set('response', body.token)
  if (ip) form.set('remoteip', ip)

  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const data = await r.json() as { success: boolean; 'error-codes'?: string[]; hostname?: string; action?: string }
    if (!data.success) {
      return NextResponse.json({ ok: false, error: 'verification_failed', codes: data['error-codes'] }, { status: 400 })
    }
    return NextResponse.json({ ok: true, hostname: data.hostname })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
