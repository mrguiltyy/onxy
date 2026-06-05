import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/cron'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/cron/prune-rate-limits
 * Runs daily at 04:00 UTC.
 *
 * Drops license_auth_attempts rows older than 72 hours.
 * 72h is more than the longest lockout window so dropping older
 * rows never lets an attacker escape an active cooldown.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  const { count } = await supabaseAdmin()
    .from('license_auth_attempts')
    .delete({ count: 'exact' })
    .lt('created_at', cutoff)

  return NextResponse.json({ ok: true, deleted: count ?? 0 })
}
