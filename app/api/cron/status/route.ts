import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Status uptime probe — call this from a cron job every ~60 seconds.
 *
 * Pings:
 *   - Supabase API (DB)
 *   - Stripe (if configured)
 * Records each result into status_checks for the public /status page.
 *
 * Auth: requires CRON_SECRET in env. Pass as header `x-cron-secret` or query `?secret=...`.
 *
 * Example cron line (calls every minute):
 *   * * * * * curl -sS https://onxy.cc/api/cron/status?secret=YOUR_CRON_SECRET > /dev/null
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = req.headers.get('x-cron-secret') ?? url.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = supabaseAdmin()
  const checks: Array<{ service: string; ok: boolean; latency_ms: number | null }> = []

  // 1) Supabase / database
  const t0 = Date.now()
  try {
    const { error } = await admin.from('profiles').select('id', { count: 'exact', head: true })
    checks.push({ service: 'auth',      ok: !error, latency_ms: Date.now() - t0 })
    checks.push({ service: 'dashboard', ok: !error, latency_ms: Date.now() - t0 })
  } catch {
    checks.push({ service: 'auth',      ok: false, latency_ms: Date.now() - t0 })
    checks.push({ service: 'dashboard', ok: false, latency_ms: Date.now() - t0 })
  }

  // 2) Public API (self-ping)
  const t1 = Date.now()
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onxy.cc'}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),  // intentionally bad → expect 400 (means endpoint is alive)
      signal: AbortSignal.timeout(5000),
    })
    // 400 means alive (responded with bad_request). 500+ means broken.
    checks.push({ service: 'api', ok: r.status < 500, latency_ms: Date.now() - t1 })
  } catch {
    checks.push({ service: 'api', ok: false, latency_ms: Date.now() - t1 })
  }

  // 3) Stripe (only if configured)
  if (process.env.STRIPE_SECRET_KEY) {
    const t2 = Date.now()
    try {
      const r = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        signal: AbortSignal.timeout(5000),
      })
      checks.push({ service: 'payments', ok: r.ok, latency_ms: Date.now() - t2 })
    } catch {
      checks.push({ service: 'payments', ok: false, latency_ms: Date.now() - t2 })
    }
  }

  // Persist
  if (checks.length) {
    await admin.from('status_checks').insert(checks as never)

    // Trim — keep last 30 days only
    await admin.from('status_checks')
      .delete()
      .lt('checked_at', new Date(Date.now() - 30 * 86400_000).toISOString())
  }

  return NextResponse.json({ checks })
}
