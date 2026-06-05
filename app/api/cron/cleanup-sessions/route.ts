import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/cron'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/cron/cleanup-sessions
 * Runs hourly.
 *
 * Deletes license_sessions rows expired more than 24 hours ago.
 * Keeps recent expirations so we can still attribute heartbeat fails.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count } = await supabaseAdmin()
    .from('license_sessions')
    .delete({ count: 'exact' })
    .lt('expires_at', cutoff)

  return NextResponse.json({ ok: true, deleted: count ?? 0 })
}
