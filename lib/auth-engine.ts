import crypto from 'crypto'

/**
 * OP Auth Engine helpers — used by the /api/v1/auth/* endpoints.
 *
 * Naming convention:
 *   - app_id      → public, embedded in the reseller's WPF tool        ("op_a1b2c3...")
 *   - app_secret  → shown once on creation, hashed in DB                ("ops_x9y8...")
 *   - license_key → shown to end user, hashed in DB                     ("OP-XXXX-XXXX-XXXX")
 *   - session_token → returned on login, used for /check + /heartbeat   (64 hex)
 *   - hwid        → SHA256 hex computed by the WPF tool from CPU + motherboard
 */

// ── Hashing ────────────────────────────────────────────────────────
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

// ── ID generators ──────────────────────────────────────────────────
function randomHex(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex')
}

export function generateAppId(): string {
  return 'op_' + randomHex(12)            // 24-char public app ID
}

export function generateAppSecret(): string {
  return 'ops_' + randomHex(24)           // 48-char private secret (shown once)
}

export function generateSessionToken(): string {
  return randomHex(32)                    // 64-char session
}

export function generateLicenseKey(): string {
  // OP-XXXX-XXXX-XXXX-XXXX (24 chars, uppercase, no ambiguous chars)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const block = () => Array.from({ length: 4 }, () =>
    alphabet[crypto.randomInt(0, alphabet.length)]
  ).join('')
  return `OP-${block()}-${block()}-${block()}-${block()}`
}

// ── Constant-time comparison ──────────────────────────────────────
export function safeCompare(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

// ── Standard error responses ──────────────────────────────────────
export const AuthError = {
  INVALID_APP:        { code: 'invalid_app',        message: 'Invalid application credentials.' },
  APP_PAUSED:         { code: 'app_paused',         message: 'This application is currently paused.' },
  APP_FROZEN:         { code: 'app_frozen',         message: 'Service temporarily unavailable.' },
  VERSION_MISMATCH:   { code: 'version_mismatch',   message: 'Please update to the latest version.' },
  INVALID_KEY:        { code: 'invalid_key',        message: 'Invalid license key.' },
  KEY_WRONG_APP:      { code: 'key_wrong_app',      message: 'License key not valid for this application.' },
  KEY_BANNED:         { code: 'key_banned',         message: 'This license has been banned.' },
  KEY_EXPIRED:        { code: 'key_expired',        message: 'This license has expired.' },
  HWID_MISMATCH:      { code: 'hwid_mismatch',      message: 'Hardware mismatch — license is bound to another device.' },
  RATE_LIMITED:       { code: 'rate_limited',       message: 'Too many attempts. Try again later.' },
  INVALID_SESSION:    { code: 'invalid_session',    message: 'Session invalid or expired.' },
  BAD_REQUEST:        { code: 'bad_request',        message: 'Malformed request.' },
  SERVER_ERROR:       { code: 'server_error',       message: 'Internal server error.' },
} as const

export type AuthErrorCode = (typeof AuthError)[keyof typeof AuthError]['code']

// ── Request body validation ──────────────────────────────────────
export function parseLoginBody(body: unknown): { app_id: string; app_secret: string; license_key: string; hwid: string; version?: string } | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const required = ['app_id', 'app_secret', 'license_key', 'hwid'] as const
  for (const k of required) {
    if (typeof b[k] !== 'string' || !(b[k] as string).trim()) return null
  }
  return {
    app_id:      (b.app_id      as string).trim(),
    app_secret:  (b.app_secret  as string).trim(),
    license_key: (b.license_key as string).trim().toUpperCase(),
    hwid:        (b.hwid        as string).trim().toLowerCase(),
    version:     typeof b.version === 'string' ? (b.version as string).trim() : undefined,
  }
}

export function parseSessionBody(body: unknown): { app_id: string; session_token: string; hwid: string } | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const required = ['app_id', 'session_token', 'hwid'] as const
  for (const k of required) {
    if (typeof b[k] !== 'string' || !(b[k] as string).trim()) return null
  }
  return {
    app_id:        (b.app_id        as string).trim(),
    session_token: (b.session_token as string).trim(),
    hwid:          (b.hwid          as string).trim().toLowerCase(),
  }
}

// ── Throttle helpers (per-IP, per-app sliding window) ────────────
export const THROTTLE_WINDOW_MS  = 60_000        // 1 minute
export const THROTTLE_MAX_ATTEMPTS = 10           // 10 fails / minute
export const THROTTLE_BLOCK_MS    = 5 * 60_000   // block for 5 minutes after exceeded

export function getRequestIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xrip = req.headers.get('x-real-ip')
  if (xrip) return xrip.trim()
  return '0.0.0.0'
}
