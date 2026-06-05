import Link from 'next/link'
import { Users, DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

const stats = [
  { label: 'Total Revenue',   value: '$4,812.00', delta: '+$892 today',   icon: DollarSign,   color: '#ff3a00' },
  { label: 'Total Users',     value: '1,248',     delta: '+12 today',     icon: Users,        color: '#ff5b75' },
  { label: 'Active Licenses', value: '892',       delta: '94 expiring',   icon: Package,      color: '#5fcb88' },
  { label: 'Orders Today',    value: '38',        delta: '+$621 revenue', icon: ShoppingCart, color: '#ffae50' },
]

const recentOrders = [
  { id: 'ORD-042', user: 'DarkByte',  product: 'Onyx Rage',    plan: '1mo', amount: '$9.99',  at: '2m ago',  status: 'completed' },
  { id: 'ORD-041', user: 'NxGhost',   product: 'Onyx Stealth', plan: '3mo', amount: '$24.99', at: '8m ago',  status: 'completed' },
  { id: 'ORD-040', user: 'ShadowFx',  product: 'Onyx Core',    plan: 'ltm', amount: '$49.99', at: '15m ago', status: 'completed' },
  { id: 'ORD-039', user: 'ZeroFrost', product: 'Onyx Rage',    plan: '1mo', amount: '$9.99',  at: '31m ago', status: 'refunded' },
]

const flagged = [
  { user: 'ghost_exe',  reason: '3 countries in 24h',         severity: 'high',   at: '1h ago' },
  { user: 'TempUser99', reason: 'Concurrent sessions from 2 IPs', severity: 'critical', at: '3h ago' },
  { user: 'ShadowRun4', reason: 'VPN detected on premium tool', severity: 'low',    at: '6h ago' },
]

export default function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Admin Overview</h1>
          <p className="text-[#9ca3af] text-sm mt-1 flex items-center gap-2">
            <span className="status status-ok"><span className="status-dot" /> 47 live sessions</span>
            <span>· Jun 1, 2026</span>
          </p>
        </div>
        <Link href="/shop" className="btn btn-line btn-sm">View Site →</Link>
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
                <TrendingUp size={13} className="text-[#5fcb88]" />
              </div>
              <p className="text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
              <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold">{s.label}</p>
              <p className="text-xs text-[#5fcb88] mt-1">{s.delta}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent orders */}
        <Card className="lg:col-span-2 p-6">
          <div className="section-h">
            <h3 className="section-h-title flex items-center gap-2"><ShoppingCart size={15} className="text-[#ff3a00]" /> Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs text-[#ff3a00] hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="overflow-x-auto -mx-6">
            <table className="table-onyx">
              <thead>
                <tr>
                  <th className="!pl-6">Order</th>
                  <th>User</th>
                  <th>Product</th>
                  <th>When</th>
                  <th>Status</th>
                  <th className="text-right !pr-6">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td className="font-mono text-[#ff3a00] text-xs !pl-6">{o.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={o.user} size="sm" />
                        <Link href={`/admin/users/${o.user}`} className="text-white font-semibold hover:text-[#ff3a00] transition-colors">@{o.user}</Link>
                      </div>
                    </td>
                    <td>{o.product} <span className="status status-mute">{o.plan}</span></td>
                    <td>{o.at}</td>
                    <td>
                      <StatusBadge tone={o.status === 'completed' ? 'ok' : 'bad'} dot>
                        {o.status === 'completed' ? 'Completed' : 'Refunded'}
                      </StatusBadge>
                    </td>
                    <td className="text-right font-bold text-white !pr-6">{o.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Flagged */}
        <Card className="p-6">
          <div className="section-h">
            <h3 className="section-h-title flex items-center gap-2"><AlertTriangle size={15} className="text-[#ffae50]" /> Security Flags</h3>
            <StatusBadge tone="warn">{flagged.length}</StatusBadge>
          </div>
          <div className="flex flex-col gap-2">
            {flagged.map(f => (
              <Link key={f.user} href={`/admin/users/${f.user}`} className="flex items-start gap-3 p-3 rounded-lg bg-[#0e1119] border border-white/[0.04] hover:border-[rgba(255,174,80,0.2)] transition-colors group">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  f.severity === 'critical' ? 'bg-[rgba(255,91,117,0.1)]'
                  : f.severity === 'high'   ? 'bg-[rgba(255,174,80,0.1)]'
                  : 'bg-[rgba(91,141,239,0.1)]'
                }`}>
                  <AlertTriangle size={12} className={
                    f.severity === 'critical' ? 'text-[#ff5b75]' : f.severity === 'high' ? 'text-[#ffae50]' : 'text-[#5b8def]'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-xs">@{f.user}</p>
                  <p className="text-[#9ca3af] text-xs mt-0.5">{f.reason}</p>
                  <p className="text-[#4b5563] text-[10px] mt-0.5">{f.at}</p>
                </div>
                <StatusBadge tone={f.severity === 'critical' ? 'bad' : f.severity === 'high' ? 'warn' : 'info'}>{f.severity}</StatusBadge>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
