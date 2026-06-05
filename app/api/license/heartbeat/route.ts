import { NextRequest, NextResponse } from 'next/server'
import { validateSession, extendSession, HEARTBEAT_SECONDS } from '@/lib/license/sessions'

/**
 * POST /api/license/heartbeat
 *
 * Tools call this every HEARTBEAT_SECONDS (300s by default).
 * Validates the session is still good and pushes the expiry forward.
 *
 * Request:  { session_token: "sess_..." }
 * Success:  { ok: true, expires_at, heartbeat_seconds }
 * Failure:  { ok: false, code: "SESSION_EXPIRED" | "LICENSE_BANNED" | ... }
 */
export async function POST(req: NextRequest) {
  let body: { session_token?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 })
  }

  const token = body.session_token
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 })
  }

  const result = await validateSession(token)

  if (!result.ok) {
    return NextResponse.json({
      ok:     false,
      code:   result.code,
      reason: messageFor(result.code),
    }, { status: 401 })
  }

  const newExpiry = await extendSession(result.session.id)

  return NextResponse.json({
    ok:                true,
    expires_at:        newExpiry,
    heartbeat_seconds: HEARTBEAT_SECONDS,
  })
}

function messageFor(code: string): string {
  switch (code) {
    case 'SESSION_NOT_FOUND': return 'Session not found. Re-authenticate.'
    case 'SESSION_EXPIRED':   return 'Session expired. Re-authenticate.'
    case 'LICENSE_INACTIVE':  return 'License is no longer active.'
    case 'LICENSE_EXPIRED':   return 'License has expired.'
    case 'LICENSE_BANNED':    return 'License has been banned.'
    default:                   return 'Authentication failed.'
  }
}
