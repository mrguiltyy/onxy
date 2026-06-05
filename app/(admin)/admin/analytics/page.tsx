import { DollarSign, Users, TrendingUp, Activity } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'

const revenueByProduct = [
  { name: 'Onyx Core',    revenue: 18900, percent: 38 },
  { name: 'Onyx Rage',    revenue: 12440, percent: 25 },
  { name: 'Onyx Apex',    revenue: 8100,  percent: 16 },
  { name: 'Onyx Stealth', revenue: 7890,  percent: 16 },
]

const topUsers = [
  { username: 'ShadowFx', spend: '$289.94', licenses: 5 },
  { username: 'DarkByte', spend: '$164.93', licenses: 4 },
  { username: 'ZeroCode', spend: '$99.96',  licenses: 2 },
  { username: 'NxGhost',  spend: '$74.97',  licenses: 3 },
]

const versionDist = [
  { version: 'v2.1.0', count: 189, percent: 76 },
  { version: 'v2.0.4', count:  41, percent: 16 },
  { version: 'v2.0.0', count:  20, percent:  8 },
]

export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl tracking-tight">Analytics</h1>
        <p className="text-[#9ca3af] text-sm mt-1">Revenue, growth, and platform insights.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'MRR',           value: '$2,841',  sub: 'Monthly Recurring',     icon: DollarSign, color: '#ff3a00' },
          { label: 'Total Revenue', value: '$49,330', sub: 'All-time gross',         icon: TrendingUp, color: '#5fcb88' },
          { label: 'Active Users',  value: '892',     sub: '+38 this week',          icon: Users,      color: '#ff5b75' },
          { label: 'Live Sessions', value: '47',      sub: 'Right now',              icon: Activity,   color: '#ffae50' },
        ].map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} hover="cyan" className="p-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <Icon size={17} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
              <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold">{s.label}</p>
              <p className="text-xs text-[#5fcb88] mt-1">{s.sub}</p>
            </Card>
          )
        })}
      </div>

      {/* Chart */}
      <Card className="p-6 mb-5">
        <div className="section-h">
          <h3 className="section-h-title">Revenue (Last 30 Days)</h3>
          <div className="flex gap-1 p-1 rounded-lg bg-[#0e1119] border border-white/[0.04]">
            {['7d', '30d', '90d', '1y'].map(r => (
              <button key={r} className={`filter-btn ${r === '30d' ? 'active' : ''}`}>{r}</button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1 h-40">
          {Array.from({ length: 30 }, (_, i) => {
            const h = Math.floor(30 + Math.random() * 70)
            const today = i === 29
            return (
              <div key={i} className="flex-1 rounded-t transition-all" style={{
                height: `${h}%`,
                background: today ? '#ff3a00' : `rgba(255,58,0,${0.15 + (h / 100) * 0.25})`,
                minWidth: 0,
                boxShadow: today ? '0 0 12px rgba(255,58,0,0.4)' : undefined,
              }} />
            )
          })}
        </div>
        <div className="flex justify-between text-[10px] text-[#4b5563] mt-2">
          <span>May 2</span><span>May 16</span><span>Jun 1</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6">
          <h3 className="section-h-title mb-5">Revenue by Product</h3>
          <div className="flex flex-col gap-4">
            {revenueByProduct.map(p => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-white font-medium">{p.name}</span>
                  <span className="text-[#5fcb88] font-bold">${(p.revenue / 100).toFixed(0)}</span>
                </div>
                <Progress value={p.percent} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="section-h-title mb-5">Top Customers</h3>
          <div className="flex flex-col gap-3">
            {topUsers.map((u, i) => (
              <div key={u.username} className="flex items-center gap-3">
                <span className="text-[#4b5563] text-xs font-bold w-5 text-right">{i + 1}</span>
                <Avatar name={u.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">@{u.username}</p>
                  <p className="text-[#9ca3af] text-xs">{u.licenses} licenses</p>
                </div>
                <span className="text-[#5fcb88] font-bold text-sm">{u.spend}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="section-h-title mb-1">Version Distribution</h3>
          <p className="text-[#9ca3af] text-xs mb-4">Onyx Rage — active sessions</p>
          <div className="flex flex-col gap-4">
            {versionDist.map(v => (
              <div key={v.version}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-mono text-white">{v.version}</span>
                  <span className="text-[#9ca3af]">{v.count} ({v.percent}%)</span>
                </div>
                <Progress value={v.percent} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
