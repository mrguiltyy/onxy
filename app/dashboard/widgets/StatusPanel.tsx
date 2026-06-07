import { supabaseAdmin } from '@/lib/supabase/server'

interface Check { service: string; ok: boolean; latency_ms: number | null }

const SERVICES = [
  'api', 'auth', 'database', 'license', 'webhooks',
  'payments', 'cdn', 'email', 'cache', 'storage',
]

export async function StatusPanel() {
  const admin = supabaseAdmin()

  // Get last check per service
  const checks: Record<string, Check | null> = {}
  await Promise.all(SERVICES.map(async svc => {
    const { data } = await admin
      .from('status_checks')
      .select('service, ok, latency_ms')
      .eq('service', svc)
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    checks[svc] = (data as Check | null) ?? null
  }))

  // Compute overall status
  const failing = SERVICES.filter(s => checks[s] && checks[s]!.ok === false)
  const allOk = failing.length === 0

  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <p className="label-mono">Status</p>
        <span className="text-[10.5px] text-[var(--fg-mute)] font-mono uppercase tracking-wider">live</span>
      </div>
      <p className="text-[12.5px] mb-3" style={{ color: allOk ? 'var(--ok)' : 'var(--bad)' }}>
        {allOk ? 'All systems operational' : `${failing.length} service${failing.length > 1 ? 's' : ''} degraded`}
      </p>

      <ul className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
        {SERVICES.map(svc => {
          const c = checks[svc]
          const status: 'ok' | 'fail' | 'unknown' =
            c === null            ? 'unknown'
            : c.ok                ? 'ok'
            : 'fail'
          return (
            <li key={svc} className="flex items-center gap-2 text-[12px]">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background:
                    status === 'ok'      ? 'var(--ok)' :
                    status === 'fail'    ? 'var(--bad)' :
                                           'var(--fg-mute)',
                  boxShadow:
                    status === 'ok'   ? '0 0 6px rgba(34,197,94,0.5)' :
                    status === 'fail' ? '0 0 6px rgba(239,68,68,0.5)' :
                                        'none',
                }}
              />
              <span className="capitalize flex-1 text-[var(--fg-dim)]">{svc}</span>
              <span
                className="text-[10.5px] font-mono uppercase tracking-wider"
                style={{
                  color:
                    status === 'ok'      ? 'var(--ok)' :
                    status === 'fail'    ? 'var(--bad)' :
                                           'var(--fg-mute)',
                }}
              >
                {status === 'ok' ? 'OK' : status === 'fail' ? 'FAIL' : '—'}
              </span>
            </li>
          )
        })}

        {/* Two non-monitored items for parity with the reference */}
        <li className="flex items-center gap-2 text-[12px]">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--ok)', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
          <span className="capitalize flex-1 text-[var(--fg-dim)]">password</span>
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--fg-mute)]">—</span>
        </li>
        <li className="flex items-center gap-2 text-[12px]">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--warn)', boxShadow: '0 0 6px rgba(250,204,21,0.5)' }} />
          <span className="capitalize flex-1 text-[var(--fg-dim)]">2FA</span>
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--warn)]">NOT SET</span>
        </li>
      </ul>
    </>
  )
}
