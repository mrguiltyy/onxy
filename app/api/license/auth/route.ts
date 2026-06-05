import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { normalizeKey, hashKey } from '@/lib/license/keys'
import { checkRateLimit, logAttempt } from '@/lib/license/rate-limit'
import { getOrClaimHwid } from '@/lib/license/hwid'
import { issueSession, HEARTBEAT_SECONDS } from '@/lib/license/sessions'

/**
 * POST /api/license/auth
 *
 * Called by every tool on launch (and by /dashboard/redeem flows).
 *
 * Request body:
 *   { key: "ONYX-XXXX-XXXX-XXXX-XXXX",
 *     hwid: "<sha256 hex>",
 *     tool_slug: "onyx-rage",
 *     version: "2.1.0" }
 *
 * Success:
 *   { ok: true,
 *     session: { token, expires_at, heartbeat_seconds },
 *     user:    { id, username, tier },
 *     license: { plan, expires_at, hwid_slots_used, hwid_slots_total } }
 *
 * Failure: { ok: false, code: "...", reason: "...", retry_after_seconds?: number }
 *
 * Generic error messaging — never reveal whether the key exists, whether the
 * HWID is known, or which step failed. Attackers learn nothing.
 */

const GENERIC_INVALID = {
  ok:     false,
  code:   'INVALID_CREDENTIALS',
  reason: 'License is invalid, expired, or revoked.',
}

export async function POST(req: NextRequest) {
  // Client IP — best-effort extraction
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  const userAgent = req.headers.get('user-agent')

  let body: { key?: string; hwid?: string; tool_slug?: string; version?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, code: 'BAD_REQUEST', reason: 'Malformed request.' }, { status: 400 })
  }

  const { key, hwid, tool_slug, version } = body

  // ── Step 0: input validation ───────────────────────────────────
  if (!key || !hwid || !tool_slug) {
    await logAttempt(ip, null, 'bad_request', userAgent)
    return NextResponse.json({ ok: false, code: 'BAD_REQUEST', reason: 'Missing required fields.' }, { status: 400 })
  }

  if (typeof hwid !== 'string' || hwid.length < 16 || hwid.length > 128) {
    await logAttempt(ip, null, 'bad_hwid', userAgent)
    return NextResponse.json(GENERIC_INVALID, { status: 401 })
  }

  const normalizedKey = normalizeKey(key)
  if (!normalizedKey) {
    await logAttempt(ip, null, 'malformed_key', userAgent)
    return NextResponse.json(GENERIC_INVALID, { status: 401 })
  }

  const keyHash = hashKey(normalizedKey)

  // ── Step 1: rate limit ─────────────────────────────────────────
  const rl = await checkRateLimit(ip, keyHash)
  if (!rl.allowed) {
    await logAttempt(ip, keyHash, `rate_limited:${rl.reason}`, userAgent)
    return NextResponse.json({
      ok:                  false,
      code:                'RATE_LIMITED',
      reason:              rl.reason === 'ip_flooded' ? 'Too many requests.' : 'Too many failed attempts. Cooling down.',
      retry_after_seconds: rl.retryAfterSec,
    }, { status: 429 })
  }

  // ── Step 2: look up license by key hash ────────────────────────
  const db = supabaseAdmin()

  interface LicenseRow {
    id:                string
    user_id:           string
    product_id:        string
    plan_id:           string | null
    status:            string
    hwid_slots_used:   number
    hwid_slots_total:  number
    expires_at:        string | null
    banned_at:         string | null
  }

  const { data: license } = await db
    .from('licenses')
    .select(`
      id, user_id, product_id, plan_id, status,
      hwid_slots_used, hwid_slots_total, expires_at, banned_at
    `)
    .eq('key_lookup_hash', keyHash)
    .single<LicenseRow>()

  if (!license) {
    await logAttempt(ip, keyHash, 'invalid_key', userAgent)
    return NextResponse.json(GENERIC_INVALID, { status: 401 })
  }

  // ── Step 3: license state checks ───────────────────────────────
  if (license.status !== 'active') {
    await logAttempt(ip, keyHash, 'license_inactive', userAgent)
    return NextResponse.json(GENERIC_INVALID, { status: 401 })
  }

  if (license.banned_at) {
    await logAttempt(ip, keyHash, 'license_banned', userAgent)
    return NextResponse.json(GENERIC_INVALID, { status: 401 })
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    await logAttempt(ip, keyHash, 'expired', userAgent)
    return NextResponse.json({
      ok:     false,
      code:   'EXPIRED',
      reason: 'License has expired. Renew on the website to continue.',
    }, { status: 401 })
  }

  // Verify tool_slug matches the licensed product
  interface ProductRow { slug: string; name: string }
  const { data: product } = await db
    .from('products')
    .select('slug, name')
    .eq('id', license.product_id)
    .single<ProductRow>()

  if (!product || product.slug !== tool_slug) {
    await logAttempt(ip, keyHash, 'tool_mismatch', userAgent)
    return NextResponse.json(GENERIC_INVALID, { status: 401 })
  }

  // ── Step 4: HWID slot claim ────────────────────────────────────
  const claim = await getOrClaimHwid({
    licenseId: license.id,
    hwidHash:  hwid,
    ip,
  })

  if (!claim.ok) {
    await logAttempt(ip, keyHash, 'hwid_limit', userAgent)
    return NextResponse.json({
      ok:     false,
      code:   'HWID_LIMIT',
      reason: 'All hardware slots for this license are in use. Reset one via your dashboard.',
    }, { status: 401 })
  }

  // ── Step 5: issue session token ────────────────────────────────
  const session = await issueSession({
    licenseId:   license.id,
    hwidId:      claim.hwidId,
    ip,
    toolVersion: version ?? null,
  })

  // ── Step 6: fetch user + plan info for the response ────────────
  interface UserRow { id: string; username: string; tier: string }
  interface PlanRow { plan_id: string; label: string }

  const { data: user } = await db
    .from('users')
    .select('id, username, tier')
    .eq('id', license.user_id)
    .single<UserRow>()

  const { data: plan } = license.plan_id
    ? await db.from('product_plans').select('plan_id, label').eq('id', license.plan_id).single<PlanRow>()
    : { data: null as PlanRow | null }

  // ── Step 7: success log + audit ────────────────────────────────
  await logAttempt(ip, keyHash, 'success', userAgent)

  await db.from('ip_logs').insert({
    user_id:    license.user_id,
    ip,
    event_type: 'tool_auth',
    user_agent: userAgent,
  } as never)

  return NextResponse.json({
    ok: true,
    session: {
      token:             session.token,
      expires_at:        session.expiresAt,
      heartbeat_seconds: HEARTBEAT_SECONDS,
    },
    user: {
      id:       user?.id,
      username: user?.username ?? 'Unknown',
      tier:     user?.tier ?? 'Onyx',
    },
    license: {
      plan:             plan?.plan_id ?? null,
      plan_label:       plan?.label ?? null,
      expires_at:       license.expires_at,
      hwid_slots_used:  license.hwid_slots_used + (claim.isNewlyRegistered ? 1 : 0),
      hwid_slots_total: license.hwid_slots_total,
    },
    product: {
      slug: product.slug,
      name: product.name,
    },
  })
}
