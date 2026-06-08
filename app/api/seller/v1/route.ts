import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { parseSellerKey, verifySecret, generateLicenseKey } from '@/lib/seller-keys'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SellerKeyRow {
  id:                 string
  user_id:            string
  key_hash:           string
  scoped_product_ids: string[] | null
  active:             boolean
  expires_at:         string | null
}

interface ProductRow {
  id:                       string
  name:                     string
  slug:                     string
  reseller_price_day:       number | null
  reseller_price_week:      number | null
  reseller_price_month:     number | null
  reseller_price_lifetime:  number | null
}

interface DurationRow {
  duration_key:   string
  duration_label: string
  duration_days:  number | null
  price_cents:    number | null
}

interface GrantRow { product_id: string }

interface ProfileBalance { balance_cents: number }

interface LicenseRow {
  id: string
  key_full: string
  key_prefix: string
  status: string
  banned: boolean
  hwid: string | null
  expires_at: string | null
  duration_days: number | null
  product: string
  product_id: string | null
  user_id: string
  created_at: string
}

const ALLOWED_ACTIONS = [
  'getsubprojects', 'getdaymaps', 'getduration', 'get_subscription_level',
  'createkey', 'keyinfo', 'getkeys', 'banuser', 'unbanuser',
  'resethwid', 'deletekey', 'getbalance',
] as const

type Action = typeof ALLOWED_ACTIONS[number]

function ok(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, ...data })
}

function fail(message: string, code: string, status = 400) {
  return NextResponse.json({ success: false, code, message }, { status })
}

async function logRequest(opts: {
  sellerKeyId: string | null
  userId:      string | null
  endpoint:    string
  ip:          string
  status:      number
  params:      Record<string, string>
  errorCode?:  string | null
  latencyMs:   number
}) {
  try {
    const admin = supabaseAdmin()
    await admin.from('seller_api_log').insert({
      seller_key_id: opts.sellerKeyId,
      user_id:       opts.userId,
      endpoint:      opts.endpoint,
      ip:            opts.ip,
      status_code:   opts.status,
      request_params: opts.params,
      error_code:    opts.errorCode ?? null,
      latency_ms:    opts.latencyMs,
    } as never)

    if (opts.sellerKeyId) {
      await admin.from('seller_keys')
        .update({ last_used_at: new Date().toISOString() } as never)
        .eq('id', opts.sellerKeyId)
    }
  } catch { /* logging is best-effort */ }
}

function getIp(req: Request): string {
  return req.headers.get('cf-connecting-ip')
      ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? '0.0.0.0'
}

export async function GET(req: Request) {
  return handle(req)
}

export async function POST(req: Request) {
  return handle(req)
}

async function handle(req: Request) {
  const start = Date.now()
  const url = new URL(req.url)
  const params = Object.fromEntries(url.searchParams)
  const ip = getIp(req)

  const ag = params.ag as Action | undefined
  const sellerkey = params.sellerkey

  if (!ag) {
    return fail('Missing required parameter: ag', 'missing_action', 400)
  }

  if (!ALLOWED_ACTIONS.includes(ag as Action)) {
    return fail(`Unknown action: ${ag}`, 'invalid_action', 400)
  }

  if (!sellerkey) {
    return fail('Missing sellerkey', 'missing_sellerkey', 401)
  }

  const parsed = parseSellerKey(sellerkey)
  if (!parsed) {
    return fail('Malformed sellerkey', 'invalid_sellerkey', 401)
  }

  const admin = supabaseAdmin()
  const { data: keyRaw } = await admin
    .from('seller_keys')
    .select('id, user_id, key_hash, scoped_product_ids, active, expires_at')
    .eq('key_prefix', parsed.prefix)
    .maybeSingle()
  const keyRow = keyRaw as SellerKeyRow | null

  if (!keyRow) {
    return fail('Invalid sellerkey', 'invalid_sellerkey', 401)
  }
  if (!verifySecret(parsed.secret, keyRow.key_hash)) {
    return fail('Invalid sellerkey', 'invalid_sellerkey', 401)
  }
  if (!keyRow.active) {
    return fail('Sellerkey is disabled', 'sellerkey_disabled', 401)
  }
  if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
    return fail('Sellerkey expired', 'sellerkey_expired', 401)
  }

  let response: NextResponse
  let errorCode: string | null = null
  try {
    response = await dispatch(ag as Action, params, keyRow, admin)
  } catch (err) {
    errorCode = 'internal_error'
    response = fail(err instanceof Error ? err.message : 'Server error', errorCode, 500)
  }

  const status = response.status
  if (status >= 400) {
    try { const body = await response.clone().json(); errorCode = (body as { code?: string }).code ?? errorCode } catch {}
  }

  await logRequest({
    sellerKeyId: keyRow.id,
    userId:      keyRow.user_id,
    endpoint:    ag,
    ip,
    status,
    params,
    errorCode,
    latencyMs:   Date.now() - start,
  })

  return response
}

// ────────────────────────────────────────────────────────────────
// Action dispatcher
// ────────────────────────────────────────────────────────────────
async function dispatch(
  action: Action,
  params: Record<string, string>,
  keyRow: SellerKeyRow,
  admin: ReturnType<typeof supabaseAdmin>,
): Promise<NextResponse> {

  switch (action) {

    /* ─── getsubprojects ─────────────────────────────────────── */
    case 'getsubprojects': {
      const { data } = await admin
        .from('reseller_grants')
        .select('product_id')
        .eq('reseller_id', keyRow.user_id)
        .eq('status', 'approved')

      const productIds = ((data as GrantRow[] | null) ?? []).map(g => g.product_id)
      if (productIds.length === 0) return ok({ projects: [] })

      const { data: prodsRaw } = await admin
        .from('products')
        .select('id, name, slug, version, status, image_url')
        .in('id', productIds)

      const projects = (prodsRaw ?? []).map((p) => {
        const product = p as { id: string; name: string; slug: string; version: string; status: string; image_url: string | null }
        return {
          id:     product.id,
          name:   product.name,
          slug:   product.slug,
          version: product.version,
          status: product.status,
          image:  product.image_url,
        }
      })
      return ok({ projects })
    }

    /* ─── getdaymaps ─────────────────────────────────────────── */
    case 'getdaymaps':
    case 'getduration': {
      const projectId = params.project_id
      let products: { id: string }[] = []

      if (projectId) {
        products = [{ id: projectId }]
      } else {
        const { data: grantsRaw } = await admin
          .from('reseller_grants').select('product_id')
          .eq('reseller_id', keyRow.user_id).eq('status', 'approved').limit(1)
        const grants = (grantsRaw as GrantRow[] | null) ?? []
        if (grants.length === 0) return fail('No projects available', 'no_projects', 400)
        products = [{ id: grants[0].product_id }]
      }

      const product = products[0]
      const { data: dursRaw } = await admin
        .from('product_durations')
        .select('duration_key, duration_label, duration_days, price_cents')
        .eq('product_id', product.id)
        .eq('active', true)
        .order('sort_order')
      const durations = (dursRaw as DurationRow[] | null) ?? []

      if (action === 'getdaymaps') {
        const daysMap: Record<string, number | null> = {}
        for (const d of durations) daysMap[d.duration_key] = d.duration_days
        return ok({
          project_id: product.id,
          durations:  durations.map(d => ({ key: d.duration_key, label: d.duration_label, days: d.duration_days })),
          days_map:   daysMap,
        })
      }

      // getduration → pricing
      return ok({
        project_id: product.id,
        pricing:    durations.map(d => ({
          key:   d.duration_key,
          label: d.duration_label,
          days:  d.duration_days,
          price: d.price_cents != null ? d.price_cents / 100 : null,
        })),
        durations,
      })
    }

    /* ─── createkey ──────────────────────────────────────────── */
    case 'createkey': {
      const duration = params.duration
      const productId = params.project_id
      const pattern = params.pattern
      const hwidLock = params.hwid_lock === '1'
      const amount = Math.min(15, Math.max(1, parseInt(params.amount ?? '1', 10)))

      if (!duration) return fail('Missing duration', 'missing_duration', 400)

      // Resolve product — either by query or first approved grant
      let resolved: { id: string; name: string; price: number | null } | null = null
      if (productId) {
        const { data } = await admin
          .from('products').select('id, name, reseller_price_day, reseller_price_week, reseller_price_month, reseller_price_lifetime')
          .eq('id', productId).maybeSingle()
        const p = data as ProductRow | null
        if (p) resolved = { id: p.id, name: p.name, price: null }
      } else {
        const { data: g } = await admin
          .from('reseller_grants').select('product_id').eq('reseller_id', keyRow.user_id)
          .eq('status', 'approved').limit(1).maybeSingle()
        if (g) {
          const grant = g as GrantRow
          const { data: pRaw } = await admin
            .from('products').select('id, name')
            .eq('id', grant.product_id).maybeSingle()
          const p = pRaw as { id: string; name: string } | null
          if (p) resolved = { id: p.id, name: p.name, price: null }
        }
      }
      if (!resolved) return fail('No approved product for this seller', 'no_product', 403)

      // Look up the duration's days + price
      const { data: durRaw } = await admin
        .from('product_durations')
        .select('duration_key, duration_days, price_cents')
        .eq('product_id', resolved.id).eq('duration_key', duration).maybeSingle()
      const dur = durRaw as { duration_days: number | null; price_cents: number | null } | null
      if (!dur) return fail('Invalid duration for this product', 'invalid_duration', 400)

      const days = dur.duration_days
      const pricePerKey = dur.price_cents ?? 0
      const total = pricePerKey * amount

      // Check wallet balance
      if (total > 0) {
        const { data: profRaw } = await admin
          .from('profiles').select('balance_cents').eq('id', keyRow.user_id).maybeSingle()
        const profile = profRaw as ProfileBalance | null
        if (!profile || profile.balance_cents < total) {
          return fail('Insufficient wallet balance', 'insufficient_balance', 402)
        }
        await admin.from('profiles')
          .update({ balance_cents: profile.balance_cents - total } as never)
          .eq('id', keyRow.user_id)
        await admin.from('transactions').insert({
          user_id:      keyRow.user_id,
          type:         'api_key_purchase',
          amount_cents: -total,
          description:  `Generated ${amount} key(s) for ${resolved.name} (${duration}) via API`,
        } as never)
      }

      // Generate the keys
      const expires = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null
      const generated: string[] = []
      const inserts = []
      for (let i = 0; i < amount; i++) {
        const k = generateLicenseKey(pattern)
        const prefix = k.split('-').slice(0, 2).join('-')
        generated.push(k)
        inserts.push({
          user_id:                keyRow.user_id,
          product:                resolved.name,
          product_id:             resolved.id,
          key_full:               k,
          key_prefix:             prefix,
          status:                 'pending',
          duration_days:          days,
          expires_at:             expires,
          created_via:            'api',
          created_by_seller_key:  keyRow.id,
          ...(hwidLock ? {} : { hwid: null }),
        })
      }
      await admin.from('licenses').insert(inserts as never)

      if (amount === 1) return ok({ license_key: generated[0], product: resolved.name, duration, days })
      return ok({ license_keys: generated, product: resolved.name, duration, days, amount })
    }

    /* ─── keyinfo ────────────────────────────────────────────── */
    case 'keyinfo': {
      const key = params.key
      if (!key) return fail('Missing key', 'missing_key', 400)
      const full = params.full === '1'

      const cols = full
        ? 'id, key_full, key_prefix, status, banned, ban_reason, hwid, expires_at, duration_days, product, product_id, user_id, last_seen, login_count, created_at'
        : 'id, key_full, key_prefix, status, banned, hwid, expires_at, duration_days, product, product_id, user_id, created_at'

      const { data } = await admin
        .from('licenses').select(cols)
        .eq('key_full', key.toUpperCase())
        .eq('user_id', keyRow.user_id)
        .maybeSingle()
      if (!data) return fail('Key not found', 'key_not_found', 404)

      return ok({ key: data })
    }

    /* ─── getkeys ────────────────────────────────────────────── */
    case 'getkeys': {
      const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '25', 10)))
      const offset = Math.max(0, parseInt(params.offset ?? '0', 10))

      const { data, count } = await admin
        .from('licenses')
        .select('id, key_full, key_prefix, status, banned, hwid, expires_at, product, product_id, created_at', { count: 'exact' })
        .eq('user_id', keyRow.user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      return ok({
        keys:   (data as LicenseRow[] | null) ?? [],
        total:  count ?? 0,
        limit,
        offset,
      })
    }

    /* ─── banuser / unbanuser ────────────────────────────────── */
    case 'banuser':
    case 'unbanuser': {
      const key = params.key
      const reason = params.reason ?? null
      if (!key) return fail('Missing key', 'missing_key', 400)

      const banned = action === 'banuser'
      const { data, error } = await admin
        .from('licenses')
        .update({
          banned,
          ban_reason: banned ? reason : null,
          status: banned ? 'banned' : 'active',
        } as never)
        .eq('key_full', key.toUpperCase())
        .eq('user_id', keyRow.user_id)
        .select('id')
        .maybeSingle()

      if (error || !data) return fail('Key not found', 'key_not_found', 404)
      return ok({ key, banned, reason })
    }

    /* ─── resethwid ──────────────────────────────────────────── */
    case 'resethwid': {
      const key = params.key
      if (!key) return fail('Missing key', 'missing_key', 400)
      const { data, error } = await admin
        .from('licenses')
        .update({ hwid: null, hwid_locked_at: null } as never)
        .eq('key_full', key.toUpperCase())
        .eq('user_id', keyRow.user_id)
        .select('id')
        .maybeSingle()
      if (error || !data) return fail('Key not found', 'key_not_found', 404)
      // Kill active sessions for this license
      await admin.from('auth_sessions').delete().eq('license_id', (data as { id: string }).id)
      return ok({ key, hwid_reset: true })
    }

    /* ─── deletekey ──────────────────────────────────────────── */
    case 'deletekey': {
      const key = params.key
      if (!key) return fail('Missing key', 'missing_key', 400)
      const { data, error } = await admin
        .from('licenses')
        .delete()
        .eq('key_full', key.toUpperCase())
        .eq('user_id', keyRow.user_id)
        .select('id')
        .maybeSingle()
      if (error || !data) return fail('Key not found', 'key_not_found', 404)
      return ok({ key, deleted: true })
    }

    /* ─── getbalance ─────────────────────────────────────────── */
    case 'getbalance': {
      const { data } = await admin
        .from('profiles').select('balance_cents').eq('id', keyRow.user_id).maybeSingle()
      const profile = data as ProfileBalance | null
      return ok({ balance_cents: profile?.balance_cents ?? 0, balance_usd: ((profile?.balance_cents ?? 0) / 100).toFixed(2) })
    }

    /* ─── get_subscription_level ─────────────────────────────── */
    case 'get_subscription_level': {
      return ok({
        project_id: '',
        default_level: 1,
        subscription_levels: [{ level: 1, name: 'Default' }],
      })
    }
  }

  return fail('Action not implemented', 'not_implemented', 501)
}

// Quiet the unused-import warning
void crypto
