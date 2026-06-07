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

interface BaseLicense {
  id:                 string
  product:            string
  key_prefix:         string
  status:             string
  expires_at:         string | null
  hwid:               string | null
  last_seen:          string | null
  duration_days:      number | null
  created_at:         string
}

interface LogSummary { event_type: string; code: string | null; created_at: string }

const DEFAULTS = {
  banned:             false,
  ban_reason:         null as string | null,
  hwid_locked_at:     null as string | null,
  hwid_reset_count:   0,
  last_hwid_reset_at: null as string | null,
  max_hwid_resets:    3,
  login_count:        0,
  is_lifetime:        false,
}

export default async function TroubleshootPage({ searchParams }: { searchParams: Promise<{ license?: string }> }) {
  const params = await searchParams
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  // Base columns — always exist from setup.sql
  const { data: licsRaw } = await supa
    .from('licenses')
    .select('id, product, key_prefix, status, expires_at, hwid, last_seen, duration_days, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const baseLicenses = (licsRaw as BaseLicense[] | null) ?? []

  // Optional extended columns — only present if auth-engine.sql + automation.sql + marketplace.sql ran.
  // We fetch them once but tolerate failure.
  let extras: Record<string, Partial<License>> = {}
  if (baseLicenses.length > 0) {
    try {
      const { data: extRaw, error } = await supa
        .from('licenses')
        .select('id, banned, ban_reason, hwid_locked_at, hwid_reset_count, last_hwid_reset_at, max_hwid_resets, login_count, is_lifetime')
        .eq('user_id', user.id)
      if (!error && extRaw) {
        for (const row of extRaw as Partial<License>[]) {
          if (row.id) extras[row.id] = row
        }
      }
    } catch { /* extended columns missing — defaults apply */ }
  }

  const licenses: License[] = baseLicenses.map(b => ({
    ...DEFAULTS,
    ...b,
    ...(extras[b.id] ?? {}),
  }))

  // Recent auth log for the selected license (if any) — tolerant if auth_logs doesn't exist
  let recentLogs: LogSummary[] = []
  const preselect = params.license ?? licenses[0]?.id ?? null
  if (preselect) {
    try {
      const admin = supabaseAdmin()
      const { data: lRaw, error } = await admin
        .from('auth_logs')
        .select('event_type, code, created_at')
        .eq('license_id', preselect)
        .order('created_at', { ascending: false })
        .limit(8)
      if (!error && lRaw) recentLogs = lRaw as LogSummary[]
    } catch { /* auth_logs table not present */ }
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
          <p className="text-[12.5px] text-[var(--fg-dim)] mb-4">Generate a license first, then come back here if you run into issues.</p>
          <a href="/products" className="btn btn-primary btn-sm inline-flex">Browse products</a>
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
