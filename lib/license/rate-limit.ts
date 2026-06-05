import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Brute force protection for the license auth endpoint.
 *
 * Two enforcement layers:
 *   • Per-IP:  100 attempts / minute (rough abuse blocker)
 *   • Per-key: 10 failures in 60 minutes → 60-minute lockout
 *
 * Backed by the license_auth_attempts table — no Redis dependency.
 * If the table grows large, prune entries > 24h via a cron later.
 */

const PER_IP_WINDOW_MS  = 60 * 1000           // 1 minute
const PER_IP_MAX        = 100

const PER_KEY_WINDOW_MS = 60 * 60 * 1000      // 1 hour
const PER_KEY_MAX_FAILS = 10

export interface RateLimitResult {
  allowed:        boolean
  reason?:        'ip_flooded' | 'key_locked'
  retryAfterSec?: number
}

export async function checkRateLimit(ip: string, keyHash: string | null): Promise<RateLimitResult> {
  const db    = supabaseAdmin()
  const now   = Date.now()
  const ipSince  = new Date(now - PER_IP_WINDOW_MS).toISOString()
  const keySince = new Date(now - PER_KEY_WINDOW_MS).toISOString()

  // ── Layer 1: per-IP throttle ──────────────────────────────────
  const { count: ipCount } = await db
    .from('license_auth_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', ipSince)

  if ((ipCount ?? 0) >= PER_IP_MAX) {
    return { allowed: false, reason: 'ip_flooded', retryAfterSec: 60 }
  }

  // ── Layer 2: per-key lockout (only when we have a key) ────────
  if (keyHash) {
    const { count: keyFails } = await db
      .from('license_auth_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('key_lookup_hash', keyHash)
      .neq('outcome', 'success')
      .gte('created_at', keySince)

    if ((keyFails ?? 0) >= PER_KEY_MAX_FAILS) {
      return { allowed: false, reason: 'key_locked', retryAfterSec: 60 * 60 }
    }
  }

  return { allowed: true }
}

export async function logAttempt(
  ip:        string,
  keyHash:   string | null,
  outcome:   string,
  userAgent: string | null = null,
): Promise<void> {
  await supabaseAdmin().from('license_auth_attempts').insert({
    ip,
    key_lookup_hash: keyHash,
    outcome,
    user_agent: userAgent,
  } as never)
}
