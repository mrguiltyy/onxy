import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, KeyRound, ShieldCheck, Cpu, Calendar, Power, RefreshCw, AlertTriangle, Check, Clock, Activity, MessageSquare } from 'lucide-react'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { formatPrice, relativeTime } from '@/lib/utils'
import { HwidResetButton } from './HwidResetButton'

export const dynamic = 'force-dynamic'

interface License {
  id:                 string
  user_id:            string
  product:            string
  product_id:         string | null
  key_full:           string
  key_prefix:         string
  status:             string
  banned:             boolean
  ban_reason:         string | null
  duration_days:      number | null
  expires_at:         string | null
  hwid:               string | null
  hwid_locked_at:     string | null
  hwid_reset_count:   number
  last_hwid_reset_at: string | null
  max_hwid_resets:    number
  last_seen:          string | null
  last_login_at:      string | null
  login_count:        number
  ip:                 string | null
  created_at:         string
  is_lifetime:        boolean
}

interface Session {
  id:             string
  hwid:           string
  ip:             string | null
  user_agent:     string | null
  last_heartbeat: string
  expires_at:     string
  created_at:     string
}

interface AuthLog {
  id:         string
  event_type: string
  code:       string | null
  ip:         string | null
  created_at: string
}

export default async function LicenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  const { data: lRaw } = await supa
    .from('licenses')
    .select('id, user_id, product, product_id, key_full, key_prefix, status, banned, ban_reason, duration_days, expires_at, hwid, hwid_locked_at, hwid_reset_count, last_hwid_reset_at, max_hwid_resets, last_seen, last_login_at, login_count, ip, created_at, is_lifetime')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const lic = lRaw as License | null
  if (!lic) notFound()

  // Active sessions for this license (service role — owner reads through join)
  const admin = supabaseAdmin()
  const { data: sessRaw } = await admin
    .from('auth_sessions')
    .select('id, hwid, ip, user_agent, last_heartbeat, expires_at, created_at')
    .eq('license_id', lic.id)
    .gte('expires_at', new Date().toISOString())
    .order('last_heartbeat', { ascending: false })
    .limit(10)
  const sessions = (sessRaw as Session[] | null) ?? []

  // Recent auth log entries for this license
  const { data: logsRaw } = await admin
    .from('auth_logs')
    .select('id, event_type, code, ip, created_at')
    .eq('license_id', lic.id)
    .order('created_at', { ascending: false })
    .limit(15)
  const logs = (logsRaw as AuthLog[] | null) ?? []

  const diagnosis = diagnose(lic)
  const resetsLeft = Math.max(0, lic.max_hwid_resets - lic.hwid_reset_count)
  const canResetByTime = !lic.last_hwid_reset_at ||
    (Date.now() - new Date(lic.last_hwid_reset_at).getTime() > 24 * 60 * 60 * 1000)

  return (
    <div className="animate-in">
      <Link href="/dashboard/licenses" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 mb-4">
        <ChevronLeft size={13} /> All licenses
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-mono mb-2">License</p>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-[24px] font-bold tracking-tight font-mono">{lic.key_prefix}-•••</h1>
            <StatusPill status={lic.status} banned={lic.banned} />
            {lic.is_lifetime && <Pill tone="ok">lifetime</Pill>}
          </div>
          <p className="text-[13.5px] text-[var(--fg-dim)]">
            {lic.product} · created {relativeTime(lic.created_at)}
          </p>
        </div>

        <Link href={`/dashboard/troubleshoot?license=${lic.id}`} className="btn btn-primary btn-sm">
          <Activity size={13} /> Run troubleshooter
        </Link>
      </div>

      {/* Diagnosis banner (auto computed) */}
      <DiagnosisBanner diagnosis={diagnosis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: stat tiles + HWID + sessions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="Status"       value={lic.banned ? 'Banned' : lic.status} icon={<ShieldCheck size={13} />} tone={lic.banned || lic.status === 'expired' ? 'bad' : lic.status === 'active' ? 'ok' : 'warn'} />
            <Tile label="Expires"      value={lic.is_lifetime ? 'Never' : lic.expires_at ? relativeTime(lic.expires_at) : 'On first use'} icon={<Calendar size={13} />} />
            <Tile label="Total logins" value={String(lic.login_count ?? 0)} icon={<Power size={13} />} />
            <Tile label="Last seen"    value={lic.last_seen ? relativeTime(lic.last_seen) : 'Never'} icon={<Activity size={13} />} />
          </div>

          {/* HWID section */}
          <div className="card">
            <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><Cpu size={14} className="text-[var(--brand)]" /> Hardware lock</h2>
              <span className="text-[11px] text-[var(--fg-mute)]">{resetsLeft}/{lic.max_hwid_resets} resets remaining</span>
            </div>
            <div className="p-5">
              {lic.hwid ? (
                <div className="space-y-3">
                  <div className="rounded-md p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
                    <p className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider mb-1">Bound HWID</p>
                    <code className="font-mono text-[12px] text-[var(--brand)] break-all">{lic.hwid}</code>
                    {lic.hwid_locked_at && (
                      <p className="text-[11px] text-[var(--fg-mute)] mt-1">Bound {relativeTime(lic.hwid_locked_at)}</p>
                    )}
                  </div>
                  <div className="text-[13px] text-[var(--fg-dim)] leading-relaxed">
                    <p className="mb-2">
                      If you got a <strong className="text-[var(--bad)]">hwid_mismatch</strong> error, you can reset the HWID
                      here. Your next login will bind to your current hardware.
                    </p>
                    <p className="text-[12px] text-[var(--fg-mute)]">
                      Limits: 1 reset per 24 hours · {lic.max_hwid_resets} total per license.
                    </p>
                  </div>
                  <HwidResetButton
                    licenseId={lic.id}
                    resetsLeft={resetsLeft}
                    canResetByTime={canResetByTime}
                    nextResetAt={lic.last_hwid_reset_at ? new Date(new Date(lic.last_hwid_reset_at).getTime() + 86_400_000).toISOString() : null}
                  />
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[13.5px] text-[var(--fg-dim)] mb-1">No hardware bound yet</p>
                  <p className="text-[12px] text-[var(--fg-mute)]">First login from your tool will lock this license to that device.</p>
                </div>
              )}
            </div>
          </div>

          {/* Active sessions */}
          <div className="card">
            <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><Power size={14} className="text-[var(--brand)]" /> Active sessions</h2>
              <span className="text-[11px] text-[var(--fg-mute)]">{sessions.length} live</span>
            </div>
            {sessions.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12.5px] text-[var(--fg-mute)]">No active sessions.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>IP</th>
                    <th>Last heartbeat</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td><code className="font-mono text-[12px] text-[var(--fg-dim)]">{s.ip ?? '—'}</code></td>
                      <td className="text-[12.5px]">{relativeTime(s.last_heartbeat)}</td>
                      <td className="text-[12.5px] text-[var(--fg-dim)]">{relativeTime(s.expires_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: auth log */}
        <div>
          <div className="card sticky top-24">
            <div className="px-4 py-3 border-b border-[var(--hairline)] flex items-center gap-2">
              <Activity size={12} className="text-[var(--brand)]" />
              <h2 className="font-semibold text-[13px]">Recent activity</h2>
            </div>
            <div className="p-2 space-y-1 max-h-[520px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="px-3 py-8 text-center text-[12px] text-[var(--fg-mute)]">No activity yet.</p>
              ) : logs.map(l => {
                const isBad = l.event_type.includes('fail') || l.event_type.includes('mismatch') || l.event_type.includes('banned')
                const isOk  = l.event_type.includes('success')
                return (
                  <div key={l.id} className="px-3 py-2 rounded-md hover:bg-[var(--surface-2)] transition-colors">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isBad ? <AlertTriangle size={10} className="text-[var(--bad)]" /> : isOk ? <Check size={10} className="text-[var(--ok)]" /> : <Clock size={10} className="text-[var(--fg-mute)]" />}
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isBad ? 'text-[var(--bad)]' : isOk ? 'text-[var(--ok)]' : 'text-[var(--fg-dim)]'}`}>
                        {l.event_type}
                      </span>
                      {l.code && <span className="text-[10.5px] text-[var(--fg-mute)] font-mono ml-auto">{l.code}</span>}
                    </div>
                    <p className="text-[10.5px] text-[var(--fg-mute)] font-mono truncate">{l.ip ?? '—'} · {relativeTime(l.created_at)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* If still stuck, open ticket pre-filled */}
      <div className="mt-8 card p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold text-[14px] mb-0.5">Still not working?</p>
          <p className="text-[12.5px] text-[var(--fg-dim)]">Run the troubleshooter first — it auto-fixes most issues without opening a ticket.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/troubleshoot?license=${lic.id}`} className="btn btn-primary btn-sm">
            <Activity size={12} /> Troubleshoot
          </Link>
          <Link href={`/dashboard/tickets/new?license=${lic.id}`} className="btn btn-secondary btn-sm">
            <MessageSquare size={12} /> Open ticket
          </Link>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Auto-diagnosis logic — runs whenever the page loads
// ────────────────────────────────────────────────────────────────
interface Diagnosis {
  status: 'ok' | 'fix' | 'warn' | 'block'
  title:  string
  body:   string
  fix?:   { label: string; href: string }
}

function diagnose(lic: License): Diagnosis {
  if (lic.banned) {
    return {
      status: 'block',
      title:  'License banned',
      body:   lic.ban_reason ?? 'This license has been banned. If you believe this is a mistake, open a ticket explaining the situation.',
    }
  }
  if (lic.status === 'expired' || (lic.expires_at && new Date(lic.expires_at) < new Date())) {
    return {
      status: 'block',
      title:  'License expired',
      body:   `This key expired ${lic.expires_at ? relativeTime(lic.expires_at) : 'recently'}. Renew on the product page or generate a new key.`,
      fix:    { label: 'Renew', href: '/dashboard/generate' },
    }
  }
  if (lic.status === 'pending' && !lic.hwid) {
    return {
      status: 'warn',
      title:  'Ready to activate',
      body:   'This key has not been used yet. First login from your tool will activate it and bind your hardware.',
    }
  }
  if (lic.status === 'active' && !lic.last_seen) {
    return {
      status: 'warn',
      title:  'Active but never connected',
      body:   'Your tool hasn\'t connected with this key yet. If you\'re getting an "invalid license" error in the tool, double-check the key matches exactly.',
    }
  }
  return {
    status: 'ok',
    title:  'Everything looks healthy',
    body:   'No issues detected with this license. If your tool is showing an error, run the troubleshooter to diagnose.',
  }
}

function DiagnosisBanner({ diagnosis }: { diagnosis: Diagnosis }) {
  const palette = {
    ok:    { bg: 'rgba(34,197,94,0.06)',   border: 'rgba(34,197,94,0.20)',   fg: 'var(--ok)',    icon: <Check size={16} /> },
    fix:   { bg: 'var(--brand-faint)',     border: 'rgba(59,130,246,0.25)',  fg: 'var(--brand)', icon: <RefreshCw size={16} /> },
    warn:  { bg: 'rgba(250,204,21,0.06)',  border: 'rgba(250,204,21,0.25)',  fg: 'var(--warn)',  icon: <Clock size={16} /> },
    block: { bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.25)',   fg: 'var(--bad)',   icon: <AlertTriangle size={16} /> },
  }[diagnosis.status]

  return (
    <div className="rounded-md p-4 mb-6 flex items-start gap-3" style={{ background: palette.bg, border: `1px solid ${palette.border}` }}>
      <span className="mt-0.5 shrink-0" style={{ color: palette.fg }}>{palette.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13.5px]" style={{ color: palette.fg }}>{diagnosis.title}</p>
        <p className="text-[12.5px] text-[var(--fg-dim)] mt-0.5 leading-relaxed">{diagnosis.body}</p>
      </div>
      {diagnosis.fix && (
        <Link href={diagnosis.fix.href} className="btn btn-sm" style={{
          background: palette.fg, color: '#1a0e14', border: 'none',
        }}>
          {diagnosis.fix.label}
        </Link>
      )}
    </div>
  )
}

function Tile({ label, value, icon, tone = 'brand' }: { label: string; value: string; icon: React.ReactNode; tone?: 'brand' | 'ok' | 'bad' | 'warn' }) {
  const c = {
    brand: { bg: 'var(--brand-faint)', fg: 'var(--brand)' },
    ok:    { bg: 'rgba(34,197,94,0.08)', fg: 'var(--ok)' },
    bad:   { bg: 'rgba(239,68,68,0.08)', fg: 'var(--bad)' },
    warn:  { bg: 'rgba(250,204,21,0.08)', fg: 'var(--warn)' },
  }[tone]
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: c.bg, color: c.fg }}>{icon}</span>
        <p className="text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[15px] font-bold capitalize tabular-nums">{value}</p>
    </div>
  )
}

function StatusPill({ status, banned }: { status: string; banned: boolean }) {
  if (banned) return <Pill tone="bad">banned</Pill>
  if (status === 'active')  return <Pill tone="ok">active</Pill>
  if (status === 'expired') return <Pill tone="bad">expired</Pill>
  if (status === 'pending') return <Pill tone="pend">pending</Pill>
  return <Pill tone="warn">{status}</Pill>
}
