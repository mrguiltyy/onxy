import Link from 'next/link'
import { Wallet, Package, Download, TrendingUp, ArrowDownLeft, ArrowUpRight, ArrowRight, Clock } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/Card'

const stats = [
  { label: 'Wallet Balance',    value: '$142.50', delta: '+$25.00 today',  icon: Wallet,     color: '#ff3a00' },
  { label: 'Active Licenses',   value: '3',       delta: '2 renew soon',   icon: Package,    color: '#ff5b75' },
  { label: 'Total Downloads',   value: '24',      delta: '+3 this week',   icon: Download,   color: '#5fcb88' },
  { label: 'Referral Earnings', value: '$18.00',  delta: '2 referrals',    icon: TrendingUp, color: '#ffae50' },
]

const recent = [
  { type: 'purchase', desc: 'Purchased Onyx Rage — 1 Month',     amount: '-$9.99',  time: '2h ago' },
  { type: 'deposit',  desc: 'Wallet top-up via Stripe',          amount: '+$25.00', time: '2h ago' },
  { type: 'download', desc: 'Downloaded Onyx Stealth v1.4.2',    amount: '',        time: '1d ago' },
  { type: 'purchase', desc: 'Purchased Onyx Core — Lifetime',    amount: '-$49.99', time: '3d ago' },
  { type: 'referral', desc: 'Referral reward from DarkByte',     amount: '+$5.00',  time: '5d ago' },
]

const licenses = [
  { name: 'Onyx Rage',    version: 'v2.1.0', plan: '1 Month',   daysLeft: 28,  slots: '1/2', status: 'undetected' as const },
  { name: 'Onyx Stealth', version: 'v1.4.2', plan: '1 Month',   daysLeft: 12,  slots: '1/1', status: 'undetected' as const },
  { name: 'Onyx Core',    version: 'v3.0.1', plan: 'Lifetime',  daysLeft: null, slots: '0/2', status: 'undetected' as const },
]

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl tracking-tight">Welcome back, DarkByte</h1>
        <p className="text-[#9ca3af] text-sm mt-1">Here&apos;s an overview of your account.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} hover="cyan" className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  <Icon size={17} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
              <p className="text-[11px] uppercase tracking-wider text-[#6b7280] font-semibold">{s.label}</p>
              <p className="text-xs text-[#5fcb88] mt-1">{s.delta}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Licenses */}
        <Card className="lg:col-span-2 p-6">
          <div className="section-h">
            <h3 className="section-h-title">Active Licenses</h3>
            <Link href="/dashboard/library" className="text-xs text-[#ff3a00] hover:underline flex items-center gap-1">
              View library <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {licenses.map(l => (
              <div key={l.name} className="flex items-center gap-4 bg-[#0e1119] rounded-lg px-4 py-3.5 border border-white/[0.04] hover:border-[rgba(255,58,0,0.15)] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[rgba(255,58,0,0.08)] border border-[rgba(255,58,0,0.15)] flex items-center justify-center">
                  <Package size={15} className="text-[#ff3a00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{l.name}</p>
                    <span className="text-[11px] font-mono text-[#6b7280]">{l.version}</span>
                  </div>
                  <p className="text-xs text-[#9ca3af]">{l.plan} · Slots: {l.slots}</p>
                </div>
                <div className="text-right flex flex-col gap-1 items-end">
                  {l.daysLeft !== null
                    ? <p className="text-xs font-semibold" style={{ color: l.daysLeft < 14 ? '#ffae50' : '#5fcb88' }}>{l.daysLeft}d left</p>
                    : <p className="text-xs font-semibold text-[#ff3a00]">Lifetime</p>
                  }
                  <StatusBadge tone="ok" dot>Undetected</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="section-h">
            <h3 className="section-h-title">Recent Activity</h3>
            <Link href="/dashboard/wallet" className="text-xs text-[#ff3a00] hover:underline">All →</Link>
          </div>
          <div className="flex flex-col gap-3">
            {recent.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{
                  background: a.type === 'deposit' || a.type === 'referral' ? 'rgba(95,203,136,0.1)' : a.type === 'purchase' ? 'rgba(255,91,117,0.1)' : 'rgba(255,58,0,0.1)',
                  border: `1px solid ${a.type === 'deposit' || a.type === 'referral' ? 'rgba(95,203,136,0.2)' : a.type === 'purchase' ? 'rgba(255,91,117,0.2)' : 'rgba(255,58,0,0.2)'}`,
                }}>
                  {a.type === 'deposit' || a.type === 'referral'
                    ? <ArrowDownLeft size={13} className="text-[#5fcb88]" />
                    : a.type === 'purchase'
                    ? <ArrowUpRight size={13} className="text-[#ff5b75]" />
                    : <Download size={13} className="text-[#ff3a00]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{a.desc}</p>
                  <p className="text-[10px] text-[#6b7280] flex items-center gap-1 mt-0.5"><Clock size={9} /> {a.time}</p>
                </div>
                {a.amount && (
                  <p className="text-xs font-bold shrink-0" style={{ color: a.amount.startsWith('+') ? '#5fcb88' : '#ff5b75' }}>{a.amount}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
