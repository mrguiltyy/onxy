import { Check, AlertTriangle, Activity, Clock, Wrench, Wifi, ShieldCheck } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin } from '@/lib/supabase/server'
import { relativeTime } from '@/lib/utils'

export const metadata = { title: 'Status · OP' }
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

const SERVICES: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'auth',      label: 'Auth API',       icon: <ShieldCheck size={14} /> },
  { key: 'dashboard', label: 'Dashboard',      icon: <Activity size={14} /> },
  { key: 'api',       label: 'Public API',     icon: <Wifi size={14} /> },
  { key: 'payments',  label: 'Payments',       icon: <Wrench size={14} /> },
]

export default async function StatusPage() {
  const admin = supabaseAdmin()

  const { data: incidentsRaw } = await admin
    .from('status_incidents')
    .select('id, title, body, severity, status, affected, started_at, resolved_at')
    .order('started_at', { ascending: false })
    .limit(20)
  const incidents = (incidentsRaw as Incident[] | null) ?? []

  const openIncidents = incidents.filter(i => i.status !== 'resolved')

  // Pull last check per service
  const checks: Record<string, Check | null> = {}
  for (const svc of SERVICES) {
    const { data: cRaw } = await admin
      .from('status_checks')
      .select('service, ok, latency_ms, checked_at')
      .eq('service', svc.key)
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    checks[svc.key] = (cRaw as Check | null) ?? null
  }

  const overallOk = openIncidents.length === 0 && Object.values(checks).every(c => c === null || c.ok)

  return (
    <PublicShell wide>
      <div className="mb-10">
        <p className="label-mono mb-2">System status</p>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-[32px] font-bold tracking-tight" style={{ letterSpacing: '-0.025em' }}>
            {overallOk ? 'All systems operational' : 'Active incident'}
          </h1>
          <span className="w-3 h-3 rounded-full" style={{
            background: overallOk ? 'var(--ok)' : 'var(--bad)',
            boxShadow: `0 0 12px ${overallOk ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          }} />
        </div>
        <p className="text-[13.5px] text-[var(--fg-dim)]">
          Live status of OP services. Updated continuously from our monitoring.
        </p>
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

      {/* Services */}
      <section className="mb-10">
        <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">Services</h2>
        <div className="card divide-y" style={{ borderColor: 'var(--hairline)' }}>
          {SERVICES.map(svc => {
            const c = checks[svc.key]
            const affected = openIncidents.some(i => i.affected.includes(svc.key))
            const ok = !affected && (c === null || c.ok)
            return (
              <div key={svc.key} className="flex items-center justify-between px-5 py-4" style={{ borderColor: 'var(--hairline)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{
                    background: ok ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
                    color:      ok ? 'var(--ok)' : 'var(--bad)',
                  }}>
                    {svc.icon}
                  </span>
                  <div>
                    <p className="font-medium text-[13.5px]">{svc.label}</p>
                    {c && <p className="text-[11px] text-[var(--fg-mute)]">
                      checked {relativeTime(c.checked_at)} · {c.latency_ms ?? '—'}ms
                    </p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ok ? (
                    <span className="text-[12px] font-medium text-[var(--ok)] inline-flex items-center gap-1.5">
                      <Check size={12} /> Operational
                    </span>
                  ) : (
                    <span className="text-[12px] font-medium text-[var(--bad)] inline-flex items-center gap-1.5">
                      <AlertTriangle size={12} /> {affected ? 'Incident' : 'Degraded'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Incident history */}
      <section>
        <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">
          Recent history
        </h2>
        {incidents.length === 0 ? (
          <div className="card p-12 text-center">
            <Check size={28} className="mx-auto mb-3 text-[var(--ok)]" />
            <p className="text-[14px]">No incidents logged. Smooth sailing.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {incidents.filter(i => i.status === 'resolved').slice(0, 10).map(i => (
              <IncidentCard key={i.id} i={i} compact />
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  )
}

function IncidentCard({ i, compact = false }: { i: Incident; compact?: boolean }) {
  const resolved = i.status === 'resolved'
  const palette = resolved
    ? { bg: 'var(--surface-2)',          border: 'var(--hairline)',        fg: 'var(--fg-dim)' }
    : i.severity === 'critical'
    ? { bg: 'rgba(239,68,68,0.06)',      border: 'rgba(239,68,68,0.25)',   fg: 'var(--bad)' }
    : i.severity === 'major'
    ? { bg: 'rgba(250,204,21,0.06)',     border: 'rgba(250,204,21,0.25)',  fg: 'var(--warn)' }
    : { bg: 'var(--brand-faint)',        border: 'rgba(59,130,246,0.25)',  fg: 'var(--brand)' }

  return (
    <div className={`card ${compact ? 'p-3' : 'p-5'}`} style={{ background: palette.bg, borderColor: palette.border }}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: palette.fg, color: '#0a0d14' }}>
              {i.severity}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: palette.fg }}>
              {i.status}
            </span>
          </div>
          <p className="font-semibold text-[14px]">{i.title}</p>
          {i.body && !compact && <p className="text-[12.5px] text-[var(--fg-dim)] mt-1 leading-relaxed whitespace-pre-wrap">{i.body}</p>}
        </div>
        <span className="text-[11px] text-[var(--fg-mute)] inline-flex items-center gap-1 shrink-0">
          <Clock size={10} />
          {relativeTime(i.started_at)}
        </span>
      </div>
      {!compact && i.affected.length > 0 && (
        <p className="text-[11px] text-[var(--fg-mute)] mt-2">
          Affected: {i.affected.map(a => SERVICES.find(s => s.key === a)?.label ?? a).join(', ')}
        </p>
      )}
    </div>
  )
}
