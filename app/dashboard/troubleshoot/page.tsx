import { redirect } from 'next/navigation'
import { Activity } from 'lucide-react'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { TroubleshootWizard } from './TroubleshootWizard'

export const metadata = { title: 'Troubleshooter' }
export const dynamic = 'force-dynamic'

interface License {
  id:                 string
  product:            string
  key_prefix:         string
  status:             string
  banned:             boolean
  ban_reason:         string | null
  expires_at:         string | null
  hwid:               string | null
  hwid_locked_at:     string | null
  hwid_reset_count:   number
  last_hwid_reset_at: string | null
  max_hwid_resets:    number
  last_seen:          string | null
  login_count:        number
  duration_days:      number | null
  created_at:         string
  is_lifetime:        boolean
}

interface LogSummary { event_type: string; code: string | null; created_at: string }

export default async function TroubleshootPage({ searchParams }: { searchParams: Promise<{ license?: string }> }) {
  const params = await searchParams
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  // All the user's licenses (for dropdown)
  const { data: licsRaw } = await supa
    .from('licenses')
    .select('id, product, key_prefix, status, banned, ban_reason, expires_at, hwid, hwid_locked_at, hwid_reset_count, last_hwid_reset_at, max_hwid_resets, last_seen, login_count, duration_days, created_at, is_lifetime')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const licenses = (licsRaw as License[] | null) ?? []

  // Recent auth log for the selected license (if any)
  let recentLogs: LogSummary[] = []
  const preselect = params.license ?? licenses[0]?.id ?? null
  if (preselect) {
    const admin = supabaseAdmin()
    const { data: lRaw } = await admin
      .from('auth_logs')
      .select('event_type, code, created_at')
      .eq('license_id', preselect)
      .order('created_at', { ascending: false })
      .limit(8)
    recentLogs = (lRaw as LogSummary[] | null) ?? []
  }

  return (
    <div className="animate-in max-w-[760px]">
      <div className="mb-8">
        <p className="label-mono mb-2">Support</p>
        <h1 className="text-[26px] font-bold tracking-tight">Troubleshooter</h1>
        <p className="text-[14px] text-[var(--fg-dim)] mt-1">
          We&apos;ll auto-diagnose your issue and fix it if we can. Opening a ticket is the last resort.
        </p>
      </div>

      {licenses.length === 0 ? (
        <div className="card p-12 text-center">
          <Activity size={28} className="mx-auto mb-3 text-[var(--fg-faint)]" />
          <p className="text-[14px] mb-1">You don&apos;t have any licenses yet</p>
          <p className="text-[12.5px] text-[var(--fg-dim)]">Generate a license first, then come back here if you run into issues.</p>
        </div>
      ) : (
        <TroubleshootWizard
          licenses={licenses}
          preselectedLicenseId={preselect}
          recentLogs={recentLogs}
        />
      )}
    </div>
  )
}
