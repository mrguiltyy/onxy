import { Check, AlertTriangle, Clock, ShieldCheck, Activity, Wrench, Wifi, Server, Cloud, Mail, Database, Box, KeyRound, Lock, Megaphone } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin } from '@/lib/supabase/server'
import { relativeTime } from '@/lib/utils'

export const metadata = {
  title: 'Status · OP',
  description: 'Live system status, uptime history, and incident timeline for all OP services.',
}
export const dynamic = 'force-dynamic'

interface Incident {
  id:          string
  title:       string
  body:        string | null
  severity:    string
  status:      string
  affected:    string[]
  started_at:  string
  resolved_at: string | null
}

interface Check {
  service:    string
  ok:         boolean
  latency_ms: number | null
  checked_at: string
}

const SERVICES: { key: string; label: string; icon: React.ComponentType<{ size?: number }>; category: string; description: string }[] = [
  { key: 'api',       label: 'Public API',        icon: Wifi,         category: 'core', description: 'REST endpoints for the auth engine (login, check, heartbeat).' },
  { key: 'auth',      label: 'Authentication',    icon: KeyRound,     category: 'core', description: 'User sessions and OAuth providers.' },
  { key: 'database',  label: 'Database',          icon: Database,     category: 'core', description: 'Primary Postgres cluster.' },
  { key: 'license',   label: 'License engine',    icon: ShieldCheck,  category: 'core', description: 'HWID validation, rate limiting, ban list.' },
  { key: 'dashboard', label: 'Dashboard',         icon: Server,       category: 'core', description: 'User-facing web app.' },
  { key: 'webhooks',  label: 'Webhooks',          icon: Activity,     category: 'integrations', description: 'Outbound webhook delivery to Discord and resellers.' },
  { key: 'payments',  label: 'Payments',          icon: Wrench,       category: 'integrations', description: 'Stripe checkout and webhook ingest.' },
  { key: 'cdn',       label: 'CDN',               icon: Cloud,        category: 'infra', description: 'Static asset edge cache.' },
  { key: 'email',     label: 'Email delivery',    icon: Mail,         category: 'integrations', description: 'Transactional email via Resend.' },
  { key: 'cache',     label: 'Cache layer',       icon: Box,          category: 'infra', description: 'Application-level caching.' },
  { key: 'storage',   label: 'Storage',           icon: Box,          category: 'infra', description: 'File and image storage.' },
  { key: 'crons',     label: 'Scheduled jobs',    icon: Clock,        category: 'infra', description: 'Background workers and cron tasks.' },
]

const CATEGORIES = [
  { key: 'core',         label: 'Core' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'infra',        label: 'Infrastructure' },
]

export default async function StatusPage() {
  const admin = supabaseAdmin()

  // Pull incidents
  const { data: incidentsRaw } = await admin
    .from('status_incidents')
    .select('id, title, body, severity, status, affected, started_at, resolved_at')
    .order('started_at', { ascending: false })
    .limit(30)
  const incidents = (incidentsRaw as Incident[] | null) ?? []
  const openIncidents = incidents.filter(i => i.status !== 'resolved')

  // For each service, pull the last 24 checks (~24h if hourly) for a sparkline
  const checksMap: Record<string, Check[]> = {}
  await Promise.all(SERVICES.map(async svc => {
    const { data } = await admin
      .from('status_checks')
      .select('service, ok, latency_ms, checked_at')
      .eq('service', svc.key)
      .order('checked_at', { ascending: false })
      .limit(48)
    checksMap[svc.key] = ((data as Check[] | null) ?? []).slice().reverse()
  }))

  const overallOk =
    openIncidents.length === 0 &&
    Object.values(checksMap).every(arr => arr.length === 0 || arr[arr.length - 1].ok)

  // Uptime percentage across all services (last 48 data points)
  const allChecks = Object.values(checksMap).flat()
  const uptimePct =
    allChecks.length === 0
      ? null
      : (allChecks.filter(c => c.ok).length / allChecks.length) * 100

  return (
    <PublicShell wide>
      {/* Hero */}
      <div className="mb-10">
        <p className="label-mono mb-2">System status</p>
        <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight flex items-center gap-3 flex-wrap" style={{ letterSpacing: '-0.025em' }}>
          <span style={{ color: overallOk ? 'var(--fg)' : 'var(--bad)' }}>
            {overallOk ? 'All systems operational' : 'Active incident'}
          </span>
        </h1>
        <p className="text-[13.5px] text-[var(--fg-dim)] mt-2">
          Live monitoring of every OP service. Probes run every minute via cron. Updated continuously.
        </p>

        {/* Top metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7 max-w-[860px]">
          <Metric label="Services up" value={`${Object.values(checksMap).filter(arr => arr.length === 0 || arr[arr.length-1].ok).length}/${SERVICES.length}`} accent={overallOk ? 'ok' : 'bad'} />
          <Metric label="48-pt uptime" value={uptimePct === null ? '—' : `${uptimePct.toFixed(2)}%`} accent="brand" />
          <Metric label="Open incidents" value={openIncidents.length} accent={openIncidents.length === 0 ? 'ok' : 'bad'} />
          <Metric label="Logged history" value={incidents.length} accent="mute" />
        </div>
      </div>

      {/* Open incidents */}
      {openIncidents.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--bad)] mb-3">
            Active incidents
          </h2>
          <div className="space-y-3">
            {openIncidents.map(i => <IncidentCard key={i.id} i={i} />)}
          </div>
        </section>
      )}

      {/* Service grids by category */}
      {CATEGORIES.map(cat => {
        const inCat = SERVICES.filter(s => s.category === cat.key)
        return (
          <section key={cat.key} className="mb-10">
            <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">{cat.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inCat.map(svc => {
                const checks = checksMap[svc.key]
                return <ServiceCard key={svc.key} svc={svc} checks={checks} affected={openIncidents.some(i => i.affected.includes(svc.key))} />
              })}
            </div>
          </section>
        )
      })}

      {/* Incident history */}
      <section className="mt-12">
        <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">
          Incident timeline
        </h2>
        {incidents.length === 0 ? (
          <div className="card p-16 text-center">
            <Check size={32} className="mx-auto mb-3 text-[var(--ok)]" />
            <p className="text-[14px]">No incidents logged. Smooth sailing.</p>
            <p className="text-[12px] text-[var(--fg-mute)] mt-1">As things happen, they show up here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {incidents.map(i => (
              <div
                key={i.id}
                className="card px-5 py-4 flex items-center gap-4"
              >
                <span
                  className="w-1 h-12 rounded-full shrink-0"
                  style={{
                    background:
                      i.status === 'resolved' ? 'var(--ok)' :
                      i.severity === 'critical' ? 'var(--bad)' :
                      i.severity === 'major' ? 'var(--warn)' :
                      'var(--brand)',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-semibold text-[13.5px]">{i.title}</p>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        background: i.status === 'resolved' ? 'rgba(34,197,94,0.10)' : 'var(--brand-faint)',
                        color:      i.status === 'resolved' ? 'var(--ok)' : 'var(--brand)',
                      }}>
                      {i.status}
                    </span>
                  </div>
                  {i.body && <p className="text-[12px] text-[var(--fg-dim)] line-clamp-1">{i.body}</p>}
                  {i.affected.length > 0 && (
                    <p className="text-[10.5px] text-[var(--fg-mute)] mt-1">
                      Affected: {i.affected.map(a => SERVICES.find(s => s.key === a)?.label ?? a).join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider">Started</p>
                  <p className="text-[12px] text-[var(--fg-dim)]">{relativeTime(i.started_at)}</p>
                  {i.resolved_at && (
                    <p className="text-[10.5px] text-[var(--ok)] mt-0.5">resolved {relativeTime(i.resolved_at)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="mt-12 rounded-md p-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
        <div className="flex items-center gap-2 text-[12px] text-[var(--fg-dim)]">
          <Megaphone size={12} className="text-[var(--brand)]" />
          Need realtime alerts? Join our Discord — incidents are pinged there instantly.
        </div>
        <a href="https://discord.gg/onxy" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
          Join Discord
        </a>
      </div>
    </PublicShell>
  )
}

// ────────────────────────────────────────────────────────────────
// Bits
// ────────────────────────────────────────────────────────────────
function Metric({ label, value, accent }: { label: string; value: string | number; accent: 'ok' | 'bad' | 'brand' | 'mute' }) {
  const c =
    accent === 'ok'   ? 'var(--ok)' :
    accent === 'bad'  ? 'var(--bad)' :
    accent === 'mute' ? 'var(--fg-dim)' :
                        'var(--fg)'
  return (
    <div className="card p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-mute)] mb-1">{label}</p>
      <p className="text-[22px] font-bold tabular-nums leading-tight" style={{ color: c, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function ServiceCard({ svc, checks, affected }: { svc: { key: string; label: string; icon: React.ComponentType<{ size?: number }>; description: string }; checks: Check[]; affected: boolean }) {
  const Icon = svc.icon
  const latest = checks[checks.length - 1]
  const ok = !affected && (!latest || latest.ok)
  const status: 'ok' | 'fail' | 'unknown' = !latest ? 'unknown' : ok ? 'ok' : 'fail'
  const upPct = checks.length === 0 ? null : (checks.filter(c => c.ok).length / checks.length) * 100

  // Sparkline: 48 bars colored by OK/fail
  const bars = []
  for (let i = 0; i < 48; i++) {
    const c = checks[i]
    bars.push(
      <span
        key={i}
        className="rounded-sm transition-colors"
        title={c ? `${new Date(c.checked_at).toLocaleString()} · ${c.ok ? 'OK' : 'FAIL'}${c.latency_ms ? ` · ${c.latency_ms}ms` : ''}` : 'no data'}
        style={{
          width: 4,
          height: 18,
          background:
            !c                   ? 'var(--surface-2)' :
            c.ok                 ? 'var(--ok)' :
                                   'var(--bad)',
          opacity: !c ? 0.4 : 1,
        }}
      />
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: ok ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
            color:      ok ? 'var(--ok)' : 'var(--bad)',
          }}>
          <Icon size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
            <p className="font-semibold text-[14px]">{svc.label}</p>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background:
                  status === 'ok'      ? 'rgba(34,197,94,0.10)' :
                  status === 'fail'    ? 'rgba(239,68,68,0.10)' :
                                         'var(--surface-2)',
                color:
                  status === 'ok'   ? 'var(--ok)' :
                  status === 'fail' ? 'var(--bad)' :
                                      'var(--fg-mute)',
              }}>
              {status === 'ok' ? <Check size={10} /> : status === 'fail' ? <AlertTriangle size={10} /> : null}
              {status === 'ok' ? 'OPERATIONAL' : status === 'fail' ? 'DEGRADED' : 'NO DATA'}
            </span>
          </div>
          <p className="text-[11.5px] text-[var(--fg-dim)] leading-relaxed">{svc.description}</p>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-3 flex items-center gap-3 text-[10.5px] text-[var(--fg-mute)]">
        <span className="font-mono uppercase tracking-wider w-6">{checks.length}</span>
        <div className="flex items-end gap-[2px] flex-1">{bars}</div>
        <span className="font-mono tabular-nums text-right w-12">{upPct === null ? '—' : `${upPct.toFixed(0)}%`}</span>
      </div>
      <div className="flex items-center justify-between text-[10.5px] text-[var(--fg-mute)] mt-1.5">
        <span>last 48 checks</span>
        {latest && <span>{latest.latency_ms ? `${latest.latency_ms}ms` : '—'} · {relativeTime(latest.checked_at)}</span>}
      </div>
    </div>
  )
}

function IncidentCard({ i }: { i: Incident }) {
  const palette =
    i.severity === 'critical' ? { bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.25)',  fg: 'var(--bad)' } :
    i.severity === 'major'    ? { bg: 'rgba(250,204,21,0.06)', border: 'rgba(250,204,21,0.25)', fg: 'var(--warn)' } :
                                { bg: 'var(--brand-faint)',    border: 'rgba(59,130,246,0.25)', fg: 'var(--brand)' }

  return (
    <div className="card p-5" style={{ background: palette.bg, borderColor: palette.border }}>
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: palette.fg, color: '#0a0d14' }}>
              {i.severity}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: palette.fg }}>
              {i.status}
            </span>
          </div>
          <p className="font-semibold text-[15px]">{i.title}</p>
          {i.body && <p className="text-[12.5px] text-[var(--fg-dim)] mt-1.5 leading-relaxed whitespace-pre-wrap">{i.body}</p>}
        </div>
        <span className="text-[11px] text-[var(--fg-mute)] inline-flex items-center gap-1 shrink-0">
          <Clock size={10} />
          {relativeTime(i.started_at)}
        </span>
      </div>
      {i.affected.length > 0 && (
        <p className="text-[11px] text-[var(--fg-mute)] mt-2">
          Affected: {i.affected.map(a => SERVICES.find(s => s.key === a)?.label ?? a).join(', ')}
        </p>
      )}
    </div>
  )
}
