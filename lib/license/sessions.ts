import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Session token issuance + validation.
 *
 * Tokens are crypto-random 32-byte values base64url-encoded.
 * Stored in license_sessions with a 10-minute sliding expiry.
 * Heartbeat extends; missed beats expire the session.
 */

const HEARTBEAT_SECONDS    = 300              // 5 minutes
const SESSION_TTL_SECONDS  = 600              // 10 minutes (= 2 heartbeats grace)

export interface IssuedSession {
  token:             string
  expiresAt:         string
  heartbeatSeconds:  number
}

function generateSessionToken(): string {
  return 'sess_' + randomBytes(24).toString('base64url')
}

export async function issueSession(opts: {
  licenseId:   string
  hwidId:      string | null
  ip:          string
  toolVersion: string | null
}): Promise<IssuedSession> {
  const token     = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString()

  await supabaseAdmin().from('license_sessions').insert({
    license_id:        opts.licenseId,
    hwid_id:           opts.hwidId,
    session_token:     token,
    ip:                opts.ip,
    tool_version:      opts.toolVersion,
    last_heartbeat_at: new Date().toISOString(),
    expires_at:        expiresAt,
  } as never)

  return { token, expiresAt, heartbeatSeconds: HEARTBEAT_SECONDS }
}

export type ValidateResult =
  | { ok: true;  session: { id: string; license_id: string; hwid_id: string | null; expires_at: string }; license: { id: string; user_id: string; status: string; expires_at: string | null; banned_at: string | null } }
  | { ok: false; code: 'SESSION_NOT_FOUND' | 'SESSION_EXPIRED' | 'LICENSE_INACTIVE' | 'LICENSE_EXPIRED' | 'LICENSE_BANNED' }

/**
 * Look up a session and validate it's still good. Used by heartbeat
 * and by any other endpoint that wants to require an authenticated session.
 */
export async function validateSession(token: string): Promise<ValidateResult> {
  const db = supabaseAdmin()

  interface SessionRow { id: string; license_id: string; hwid_id: string | null; expires_at: string }
  interface LicenseRow { id: string; user_id: string; status: string; expires_at: string | null; banned_at: string | null }

  const { data: session } = await db
    .from('license_sessions')
    .select('id, license_id, hwid_id, expires_at')
    .eq('session_token', token)
    .single<SessionRow>()

  if (!session)                                  return { ok: false, code: 'SESSION_NOT_FOUND' }
  if (new Date(session.expires_at) < new Date()) return { ok: false, code: 'SESSION_EXPIRED' }

  const { data: license } = await db
    .from('licenses')
    .select('id, user_id, status, expires_at, banned_at')
    .eq('id', session.license_id)
    .single<LicenseRow>()

  if (!license || license.status !== 'active')                          return { ok: false, code: 'LICENSE_INACTIVE' }
  if (license.expires_at && new Date(license.expires_at) < new Date()) return { ok: false, code: 'LICENSE_EXPIRED' }
  if (license.banned_at)                                                return { ok: false, code: 'LICENSE_BANNED' }

  return { ok: true, session, license }
}

/**
 * Push the session expiry forward by one TTL window. Called by heartbeat.
 */
export async function extendSession(sessionId: string): Promise<string> {
  const newExpiry = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString()

  await supabaseAdmin()
    .from('license_sessions')
    .update({
      expires_at:        newExpiry,
      last_heartbeat_at: new Date().toISOString(),
    } as never)
    .eq('id', sessionId)

  return newExpiry
}

/**
 * Force-expire a session immediately. Used by admin revoke + user "kill session".
 */
export async function revokeSession(token: string): Promise<void> {
  await supabaseAdmin()
    .from('license_sessions')
    .update({ expires_at: new Date(0).toISOString() } as never)
    .eq('session_token', token)
}

export { HEARTBEAT_SECONDS, SESSION_TTL_SECONDS }
