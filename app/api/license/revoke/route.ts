import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/license/revoke
 *
 * Admin-only. Kills a session immediately (by session token) OR
 * bans a license entirely (by license id).
 *
 * Request:  { session_token?: string } | { license_id: string, reason?: string }
 */
export async function POST(req: NextRequest) {
  // Verify caller is admin
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  interface RoleRow { role: string }
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<RoleRow>()

  if (!profile || (profile.role !== 'super_admin' && profile.role !== 'support')) {
    return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 })
  }

  // Process the revoke
  let body: { session_token?: string; license_id?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 })
  }

  const db = supabaseAdmin()

  if (body.session_token) {
    await db
      .from('license_sessions')
      .update({ expires_at: new Date(0).toISOString() } as never)
      .eq('session_token', body.session_token)

    return NextResponse.json({ ok: true, scope: 'session' })
  }

  if (body.license_id) {
    await db
      .from('licenses')
      .update({
        banned_at:     new Date().toISOString(),
        banned_reason: body.reason ?? 'Revoked by admin',
        status:        'revoked',
      } as never)
      .eq('id', body.license_id)

    // Also kill all live sessions for this license
    await db
      .from('license_sessions')
      .update({ expires_at: new Date(0).toISOString() } as never)
      .eq('license_id', body.license_id)

    // Audit log
    await db.from('audit_logs').insert({
      admin_id:    user.id,
      action:      'REVOKE_LICENSE',
      target_type: 'license',
      target_id:   body.license_id,
      payload:     { reason: body.reason ?? null },
    } as never)

    return NextResponse.json({ ok: true, scope: 'license' })
  }

  return NextResponse.json({ ok: false, code: 'BAD_REQUEST', reason: 'Provide session_token or license_id.' }, { status: 400 })
}
