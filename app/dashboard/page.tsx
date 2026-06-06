import Link from 'next/link'
import { KeyRound, Plus, Wallet, Activity, ArrowRight, ShieldCheck } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { formatPrice, relativeTime } from '@/lib/utils'
import { Pill } from '@/components/ui/Pill'

interface Profile  { username: string; balance_cents: number; parent_id: string }
interface License  { id: string; product: string; key_prefix: string; status: string; expires_at: string | null; created_at: string }
interface ActivityRow { id: string; event_type: string; target_label: string | null; created_at: string }

export default async function DashboardPage() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('username, balance_cents, parent_id')
    .eq('id', user!.id)
    .single()

  const profile = (profileRaw ?? null) as Profile | null

  const { data: licenses } = await supabase
    .from('licenses')
    .select('id, product, key_prefix, status, expires_at, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const lics = (licenses ?? []) as License[]

  const { data: actsRaw } = await supabase
    .from('activity')
    .select('id, event_type, target_label, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const acts = (actsRaw ?? []) as ActivityRow[]

  const totalKeys     = lics.length
  const activeKeys    = lics.filter(l => l.status === 'active').length
  const expiredKeys   = lics.filter(l => l.status === 'expired').length
  const bannedKeys    = lics.filter(l => l.status === 'banned').length

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight">Welcome back, {profile?.username}</h1>
        <p className="text-[14px] text-[var(--fg-dim)] mt-1">Here&apos;s an overview of your panel.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Balance"      value={formatPrice(profile?.balance_cents ?? 0)} sub={`Parent ${profile?.parent_id ?? '#1'}`} accent="brand" icon={<Wallet size={16} />} />
        <StatCard label="Total Keys"   value={totalKeys.toString()}                     sub={`${activeKeys} active`}              accent="brand" icon={<KeyRound size={16} />} />
        <StatCard label="Expired"      value={expiredKeys.toString()}                   sub="In last 30 days"                     accent="bad"   icon={<KeyRound size={16} />} />
        <StatCard label="Banned"       value={bannedKeys.toString()}                    sub="Lifetime"                            accent="warn"  icon={<ShieldCheck size={16} />} />
      </div>

      {/* Main grid: licenses + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Licenses preview */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--hairline)]">
            <h2 className="font-semibold">Recent licenses</h2>
            <Link href="/dashboard/licenses" className="text-[12px] text-[var(--brand)] hover:underline inline-flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {lics.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <KeyRound size={28} className="mx-auto mb-3 text-[var(--fg-faint)]" />
              <p className="text-[14px] font-medium text-[var(--fg)] mb-1">No licenses yet</p>
              <p className="text-[12.5px] text-[var(--fg-dim)] mb-4">Generate your first key to get started.</p>
              <Link href="/dashboard/generate" className="btn btn-primary btn-sm inline-flex">
                <Plus size={13} /> Generate license
              </Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>License key</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {lics.map(l => (
                  <tr key={l.id}>
                    <td>
                      <code className="font-mono text-[12.5px] text-[var(--brand)]">{l.key_prefix}-•••-•••</code>
                    </td>
                    <td className="text-[var(--fg)] font-medium">{l.product}</td>
                    <td><StatusPill status={l.status} /></td>
                    <td className="text-[12.5px]">
                      {l.expires_at ? relativeTime(l.expires_at) : 'Lifetime'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--hairline)]">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[var(--brand)]" />
              <h2 className="font-semibold">Recent Activity</h2>
            </div>
          </div>
          <div className="px-2 py-2">
            {acts.length === 0 ? (
              <p className="px-3 py-8 text-center text-[12.5px] text-[var(--fg-mute)]">No activity yet.</p>
            ) : (
              acts.map(a => <ActivityRowComponent key={a.id} event={a.event_type} label={a.target_label} when={a.created_at} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string; accent: 'brand' | 'ok' | 'bad' | 'warn'; icon: React.ReactNode
}) {
  const colors: Record<typeof accent, { bg: string; fg: string }> = {
    brand: { bg: 'rgba(59,130,246,0.10)',  fg: 'var(--brand)' },
    ok:    { bg: 'rgba(34,197,94,0.10)',   fg: 'var(--ok)' },
    bad:   { bg: 'rgba(239,68,68,0.10)',   fg: 'var(--bad)' },
    warn:  { bg: 'rgba(250,204,21,0.10)',  fg: 'var(--warn)' },
  }
  const c = colors[accent]
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between mb-4">
        <span
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ background: c.bg, color: c.fg }}
        >
          {icon}
        </span>
      </div>
      <p className="text-[24px] font-bold tabular-nums" style={{ letterSpacing: '-0.02em' }}>{value}</p>
      <p className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider mt-1">{label}</p>
      {sub && <p className="text-[11.5px] text-[var(--fg-dim)] mt-1">{sub}</p>}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: 'ok' | 'bad' | 'warn' | 'pend'; label: string }> = {
    active:  { tone: 'ok',   label: 'Active' },
    expired: { tone: 'bad',  label: 'Expired' },
    banned:  { tone: 'warn', label: 'Banned' },
    pending: { tone: 'pend', label: 'Pending' },
  }
  const m = map[status] ?? { tone: 'pend' as const, label: status }
  return <Pill tone={m.tone}>{m.label}</Pill>
}

function ActivityRowComponent({ event, label, when }: { event: string; label: string | null; when: string }) {
  const color =
    event === 'generated' ? 'var(--ok)'
    : event === 'banned'  ? 'var(--bad)'
    : event === 'redeemed'? 'var(--brand)'
    : 'var(--fg-mute)'

  return (
    <div className="flex items-start gap-3 px-3 py-3 rounded-md hover:bg-[var(--surface-2)] transition-colors">
      <span
        className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold mt-0.5 shrink-0"
        style={{ background: `${color}1a`, color }}
      >
        <Activity size={12} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[var(--fg)] font-medium capitalize">{event}</p>
        {label && <p className="text-[11.5px] text-[var(--fg-dim)] font-mono truncate">{label}</p>}
        <p className="text-[10.5px] text-[var(--fg-mute)] mt-0.5">{relativeTime(when)}</p>
      </div>
    </div>
  )
}
