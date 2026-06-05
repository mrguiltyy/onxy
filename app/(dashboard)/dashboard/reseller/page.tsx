'use client'
import Link from 'next/link'
import { Wallet, Key, TrendingUp, Users, Plus, Eye, BarChart3, ArrowRight, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Progress } from '@/components/ui/Progress'

const stats = [
  { label: 'Total Revenue',     value: '$1,247.50', delta: '+$184 this week', icon: TrendingUp, color: '#5fcb88' },
  { label: 'Keys Generated',    value: '186',       delta: '12 today',        icon: Key,        color: '#ff3a00' },
  { label: 'Keys Sold',         value: '142',       delta: '76% sell-through', icon: Sparkles,  color: '#ff5b75' },
  { label: 'Wallet Balance',    value: '$324.80',   delta: 'Available',       icon: Wallet,     color: '#ffae50' },
]

const recentActivity = [
  { type: 'generated', detail: '10× Onyx Rage — 1 Month',     amount: '-$25.00', at: '2h ago' },
  { type: 'sold',      detail: 'Onyx Rage key sold (manual)', amount: '+$7.50',  at: '4h ago' },
  { type: 'generated', detail: '5× Onyx Core — Lifetime',     amount: '-$62.50', at: '1d ago' },
  { type: 'sold',      detail: 'Onyx Core key sold (manual)', amount: '+$45.00', at: '1d ago' },
  { type: 'topup',     detail: 'Wallet top-up',                amount: '+$100.00', at: '2d ago' },
]

const topProducts = [
  { product: 'Onyx Rage',    sold: 68, revenue: 51000 },
  { product: 'Onyx Core',    sold: 42, revenue: 31500 },
  { product: 'Onyx Stealth', sold: 28, revenue: 21000 },
  { product: 'Onyx Pulse',   sold:  4, revenue:  1500 },
]

export default function ResellerDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto">

      {/* Hero header */}
      <div className="relative mb-8 rounded-2xl overflow-hidden p-8 border border-[rgba(255,174,80,0.18)]" style={{
        background: 'linear-gradient(135deg, rgba(255,174,80,0.08) 0%, rgba(20,24,35,0.95) 60%)',
      }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[80px] pointer-events-none" style={{ background: 'rgba(255,174,80,0.12)', transform: 'translate(40px, -40px)' }} />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,174,80,0.1)] border border-[rgba(255,174,80,0.25)] mb-3">
              <Sparkles size={11} className="text-[#ffae50]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ffae50]">Reseller Program · Active</span>
            </div>
            <h1 className="text-white font-bold tracking-tight mb-2" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', letterSpacing: '-0.025em' }}>
              Welcome back, reseller.
            </h1>
            <p className="text-[#9ca3af] text-sm max-w-md">
              Generate license keys at <span className="text-[#ffae50] font-bold">75% off retail</span>, sell at your own price, keep the profit.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link href="/dashboard/reseller/generate" className="btn btn-primary"><Plus size={14} /> Generate Keys</Link>
            <Link href="/dashboard/reseller/inventory" className="btn btn-line"><Key size={14} /> My Inventory</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} hover="cyan" className="p-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <Icon size={17} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
              <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold">{s.label}</p>
              <p className="text-xs text-[#5fcb88] mt-1">{s.delta}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Top performing products */}
        <Card className="lg:col-span-2 p-6">
          <div className="section-h">
            <h3 className="section-h-title flex items-center gap-2"><BarChart3 size={15} className="text-[#ff3a00]" /> Top Performing Products</h3>
            <Link href="/dashboard/reseller/inventory" className="text-xs text-[#ff3a00] hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <div className="flex flex-col gap-4">
            {topProducts.map(p => {
              const max = Math.max(...topProducts.map(x => x.revenue))
              const pct = (p.revenue / max) * 100
              return (
                <div key={p.product}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white font-medium text-sm">{p.product}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#9ca3af] text-xs">{p.sold} sold</span>
                      <span className="text-[#5fcb88] font-bold text-sm">${(p.revenue / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  <Progress value={pct} />
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="p-6">
          <h3 className="section-h-title mb-5">Recent Activity</h3>
          <div className="flex flex-col gap-3">
            {recentActivity.map((a, i) => {
              const isOut = a.amount.startsWith('-')
              const Icon = a.type === 'generated' ? Key : a.type === 'sold' ? Sparkles : Wallet
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0`} style={{
                    background: isOut ? 'rgba(255,91,117,0.08)' : 'rgba(95,203,136,0.08)',
                    border: `1px solid ${isOut ? 'rgba(255,91,117,0.2)' : 'rgba(95,203,136,0.2)'}`,
                  }}>
                    <Icon size={12} style={{ color: isOut ? '#ff5b75' : '#5fcb88' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium truncate">{a.detail}</p>
                    <p className="text-[10px] text-[#6b7280] mt-0.5">{a.at}</p>
                  </div>
                  <p className="text-xs font-bold shrink-0" style={{ color: isOut ? '#ff5b75' : '#5fcb88' }}>{a.amount}</p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* CTA strip */}
      <div className="mt-6 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{
        background: 'linear-gradient(135deg, rgba(255,58,0,0.06) 0%, rgba(20,24,35,0.7) 100%)',
        border: '1px solid rgba(255,58,0,0.15)',
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(255,58,0,0.1)] border border-[rgba(255,58,0,0.2)] flex items-center justify-center">
            <Users size={17} className="text-[#ff3a00]" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Ready to scale?</p>
            <p className="text-[#9ca3af] text-xs">View your reseller terms and request a custom discount tier.</p>
          </div>
        </div>
        <Link href="/dashboard/tickets/new" className="btn btn-line shrink-0">Contact Reseller Manager →</Link>
      </div>
    </div>
  )
}
