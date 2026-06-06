import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { AuthError, getRequestIp, parseSessionBody, safeCompare } from '@/lib/auth-engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Session {
  id:           string
  license_id:   string
  app_id:       string
  session_token: string
  hwid:         string
  expires_at:   string
}

interface App {
  id:     string
  app_id: string
  status: string
  freeze_users: boolean
}

interface License {
  banned: boolean
  status: string
  expires_at: string | null
}

export async function POST(req: Request) {
  const supa = supabaseAdmin()
  const ip = getRequestIp(req)

  let body: unknown
  try { body = await req.json() } catch { return fail(AuthError.BAD_REQUEST) }
  const parsed = parseSessionBody(body)
  if (!parsed) return fail(AuthError.BAD_REQUEST)

  // 1) Lookup session
  const { data: sRaw } = await supa
    .from('auth_sessions')
    .select('id, license_id, app_id, session_token, hwid, expires_at')
    .eq('session_token', parsed.session_token)
    .maybeSingle()
  const s = sRaw as Session | null
  if (!s) return fail(AuthError.INVALID_SESSION)

  // 2) Lookup app and verify app_id matches
  const { data: aRaw } = await supa
    .from('applications')
    .select('id, app_id, status, freeze_users')
    .eq('id', s.app_id)
    .maybeSingle()
  const app = aRaw as App | null
  if (!app || app.app_id !== parsed.app_id) return fail(AuthError.INVALID_APP)
  if (app.status !== 'active' || app.freeze_users) return fail(AuthError.APP_FROZEN)

  // 3) Session expiry
  if (new Date(s.expires_at) < new Date()) return fail(AuthError.INVALID_SESSION)

  // 4) HWID still matches
  if (!safeCompare(s.hwid, parsed.hwid)) {
    await logEvent(supa, app.id, s.license_id, 'check_fail', AuthError.HWID_MISMATCH.code, ip, parsed.hwid)
    return fail(AuthError.HWID_MISMATCH)
  }

  // 5) License still good
  const { data: lRaw } = await supa
    .from('licenses')
    .select('banned, status, expires_at')
    .eq('id', s.license_id)
    .maybeSingle()
  const lic = lRaw as License | null
  if (!lic) return fail(AuthError.INVALID_SESSION)
  if (lic.banned || lic.status === 'banned') return fail(AuthError.KEY_BANNED)
  if (lic.expires_at && new Date(lic.expires_at) < new Date()) return fail(AuthError.KEY_EXPIRED)

  return NextResponse.json({ success: true, valid: true })
}

type SupaAdmin = ReturnType<typeof supabaseAdmin>

function fail(e: { code: string; message: string }) {
  return NextResponse.json({ success: false, valid: false, code: e.code, message: e.message }, { status: 401 })
}

async function logEvent(supa: SupaAdmin, appId: string, licenseId: string, eventType: string, code: string, ip: string, hwid: string) {
  await supa.from('auth_logs').insert({
    app_id: appId, license_id: licenseId, event_type: eventType, code, ip, hwid,
  } as never)
}
