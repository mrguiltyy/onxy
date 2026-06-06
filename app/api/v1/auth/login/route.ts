import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  AuthError,
  generateSessionToken,
  getRequestIp,
  parseLoginBody,
  safeCompare,
  sha256,
  THROTTLE_BLOCK_MS,
  THROTTLE_MAX_ATTEMPTS,
  THROTTLE_WINDOW_MS,
} from '@/lib/auth-engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Application {
  id:            string
  app_id:        string
  secret_hash:   string
  status:        string
  hwid_lock:     boolean
  version:       string
  version_check: boolean
  freeze_users:  boolean
}

interface License {
  id:               string
  user_id:          string
  app_id:           string | null
  product:          string
  key_full:         string
  status:           string
  banned:           boolean
  expires_at:       string | null
  hwid:             string | null
  hwid_locked_at:   string | null
  duration_days:    number | null
}

interface Profile {
  username: string
}

interface Throttle {
  attempts:        number
  window_start:    string
  blocked_until:   string | null
}

export async function POST(req: Request) {
  const ip       = getRequestIp(req)
  const userAgent = req.headers.get('user-agent') ?? ''
  const supa     = supabaseAdmin()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err(AuthError.BAD_REQUEST)
  }

  const parsed = parseLoginBody(body)
  if (!parsed) return err(AuthError.BAD_REQUEST)

  // ── 1) Find application ────────────────────────────────────────
  const { data: appRaw } = await supa
    .from('applications')
    .select('id, app_id, secret_hash, status, hwid_lock, version, version_check, freeze_users')
    .eq('app_id', parsed.app_id)
    .maybeSingle()

  const app = appRaw as Application | null
  if (!app) return logAndFail(supa, null, null, 'login_fail', AuthError.INVALID_APP, ip, parsed.hwid, userAgent)

  // ── 2) Throttle check (per IP + app) ───────────────────────────
  const throttled = await checkThrottle(supa, ip, app.id)
  if (throttled) return logAndFail(supa, app.id, null, 'login_fail', AuthError.RATE_LIMITED, ip, parsed.hwid, userAgent)

  // ── 3) Verify app_secret ───────────────────────────────────────
  const secretHash = sha256(parsed.app_secret)
  if (!safeCompare(secretHash, app.secret_hash)) {
    await bumpThrottle(supa, ip, app.id)
    return logAndFail(supa, app.id, null, 'login_fail', AuthError.INVALID_APP, ip, parsed.hwid, userAgent)
  }

  // ── 4) Status / freeze / version checks ────────────────────────
  if (app.status !== 'active') return logAndFail(supa, app.id, null, 'login_fail', AuthError.APP_PAUSED, ip, parsed.hwid, userAgent)
  if (app.freeze_users)        return logAndFail(supa, app.id, null, 'login_fail', AuthError.APP_FROZEN, ip, parsed.hwid, userAgent)
  if (app.version_check && parsed.version && parsed.version !== app.version) {
    return logAndFail(supa, app.id, null, 'login_fail', AuthError.VERSION_MISMATCH, ip, parsed.hwid, userAgent)
  }

  // ── 5) Find license by full key (stored plaintext in this MVP;
  //       hash storage upgrade tracked in roadmap) ────────────────
  const { data: licRaw } = await supa
    .from('licenses')
    .select('id, user_id, app_id, product, key_full, status, banned, expires_at, hwid, hwid_locked_at, duration_days')
    .eq('key_full', parsed.license_key)
    .maybeSingle()

  const lic = licRaw as License | null
  if (!lic) {
    await bumpThrottle(supa, ip, app.id)
    return logAndFail(supa, app.id, null, 'login_fail', AuthError.INVALID_KEY, ip, parsed.hwid, userAgent)
  }

  if (lic.app_id && lic.app_id !== app.id) {
    return logAndFail(supa, app.id, lic.id, 'login_fail', AuthError.KEY_WRONG_APP, ip, parsed.hwid, userAgent)
  }
  if (lic.banned || lic.status === 'banned') {
    return logAndFail(supa, app.id, lic.id, 'banned_attempt', AuthError.KEY_BANNED, ip, parsed.hwid, userAgent)
  }
  if (lic.expires_at && new Date(lic.expires_at) < new Date()) {
    return logAndFail(supa, app.id, lic.id, 'login_fail', AuthError.KEY_EXPIRED, ip, parsed.hwid, userAgent)
  }

  // ── 6) HWID handling (bind on first login, verify after) ───────
  if (app.hwid_lock) {
    if (lic.hwid) {
      if (!safeCompare(lic.hwid, parsed.hwid)) {
        return logAndFail(supa, app.id, lic.id, 'hwid_mismatch', AuthError.HWID_MISMATCH, ip, parsed.hwid, userAgent)
      }
    } else {
      // First login — bind HWID
      await supa.from('licenses')
        .update({ hwid: parsed.hwid, hwid_locked_at: new Date().toISOString() } as never)
        .eq('id', lic.id)
    }
  }

  // ── 7) Activate license if it was pending ──────────────────────
  const now = new Date()
  let expiresAt = lic.expires_at
  if (lic.status === 'pending') {
    if (lic.duration_days && lic.duration_days > 0) {
      expiresAt = new Date(now.getTime() + lic.duration_days * 86_400_000).toISOString()
    }
    await supa.from('licenses')
      .update({ status: 'active', expires_at: expiresAt, app_id: app.id } as never)
      .eq('id', lic.id)
  }

  // ── 8) Mint session token (24h expiry, refreshable via heartbeat)
  const sessionToken = generateSessionToken()
  const sessionExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

  await supa.from('auth_sessions').insert({
    license_id:     lic.id,
    app_id:         app.id,
    session_token:  sessionToken,
    hwid:           parsed.hwid,
    ip,
    user_agent:     userAgent,
    expires_at:     sessionExpires,
  } as never)

  // ── 9) Update license stats ────────────────────────────────────
  await supa.from('licenses')
    .update({
      last_seen:      now.toISOString(),
      last_login_at:  now.toISOString(),
      ip,
    } as never)
    .eq('id', lic.id)

  // ── 10) Fetch owner username (for display) ─────────────────────
  const { data: profRaw } = await supa
    .from('profiles')
    .select('username')
    .eq('id', lic.user_id)
    .maybeSingle()
  const owner = (profRaw as Profile | null)?.username ?? 'reseller'

  // Bump login_count (best-effort)
  await supa.from('licenses')
    .update({ login_count: (lic as unknown as { login_count?: number }).login_count ? (lic as unknown as { login_count: number }).login_count + 1 : 1 } as never)
    .eq('id', lic.id)

  await logEvent(supa, app.id, lic.id, 'login_success', null, ip, parsed.hwid, userAgent)

  return NextResponse.json({
    success:       true,
    session_token: sessionToken,
    expires_at:    sessionExpires,
    user: {
      product:    lic.product,
      expires_at: expiresAt,
      reseller:   owner,
    },
    message: 'Login successful.',
  })
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

type SupaAdmin = ReturnType<typeof supabaseAdmin>

function err(e: { code: string; message: string }, status = 400) {
  return NextResponse.json({ success: false, code: e.code, message: e.message }, { status })
}

async function logEvent(
  supa: SupaAdmin,
  appId: string | null,
  licenseId: string | null,
  eventType: string,
  code: string | null,
  ip: string,
  hwid: string,
  ua: string,
) {
  await supa.from('auth_logs').insert({
    app_id:     appId,
    license_id: licenseId,
    event_type: eventType,
    code,
    ip,
    hwid,
    user_agent: ua,
  } as never)
}

async function logAndFail(
  supa: SupaAdmin,
  appId: string | null,
  licenseId: string | null,
  eventType: string,
  e: { code: string; message: string },
  ip: string,
  hwid: string,
  ua: string,
) {
  await logEvent(supa, appId, licenseId, eventType, e.code, ip, hwid, ua)
  return err(e, e.code === 'rate_limited' ? 429 : 401)
}

async function checkThrottle(supa: SupaAdmin, ip: string, appId: string): Promise<boolean> {
  const { data: tRaw } = await supa
    .from('auth_throttle')
    .select('attempts, window_start, blocked_until')
    .eq('ip', ip)
    .eq('app_id', appId)
    .maybeSingle()
  const t = tRaw as Throttle | null
  if (!t) return false
  if (t.blocked_until && new Date(t.blocked_until) > new Date()) return true
  return false
}

async function bumpThrottle(supa: SupaAdmin, ip: string, appId: string) {
  const { data: tRaw } = await supa
    .from('auth_throttle')
    .select('attempts, window_start, blocked_until')
    .eq('ip', ip)
    .eq('app_id', appId)
    .maybeSingle()
  const t = tRaw as Throttle | null
  const now = new Date()

  if (!t) {
    await supa.from('auth_throttle').insert({
      ip, app_id: appId, attempts: 1, window_start: now.toISOString(),
    } as never)
    return
  }

  const windowStart = new Date(t.window_start)
  if (now.getTime() - windowStart.getTime() > THROTTLE_WINDOW_MS) {
    // Window expired — reset
    await supa.from('auth_throttle')
      .update({ attempts: 1, window_start: now.toISOString(), blocked_until: null } as never)
      .eq('ip', ip).eq('app_id', appId)
    return
  }

  const newAttempts = t.attempts + 1
  if (newAttempts >= THROTTLE_MAX_ATTEMPTS) {
    await supa.from('auth_throttle')
      .update({
        attempts: newAttempts,
        blocked_until: new Date(now.getTime() + THROTTLE_BLOCK_MS).toISOString(),
      } as never)
      .eq('ip', ip).eq('app_id', appId)
  } else {
    await supa.from('auth_throttle')
      .update({ attempts: newAttempts } as never)
      .eq('ip', ip).eq('app_id', appId)
  }
}
