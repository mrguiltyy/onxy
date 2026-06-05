'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Sparkles, TrendingUp, Key, Users, Plus, ChevronRight, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const resellers = [
  { id: 'shadowfx',  username: 'ShadowFx',  discount: 75, keysGenerated: 186, keysSold: 142, revenue: 124750, joinedReseller: 'May 1, 2026',  status: 'active'   },
  { id: 'darkbyte',  username: 'DarkByte',  discount: 75, keysGenerated:  68, keysSold:  54, revenue:  48500, joinedReseller: 'May 8, 2026',  status: 'active'   },
  { id: 'nxghost',   username: 'NxGhost',   discount: 80, keysGenerated:  42, keysSold:  38, revenue:  32400, joinedReseller: 'Apr 1, 2026',  status: 'active'   },
  { id: 'zerocode',  username: 'ZeroCode',  discount: 75, keysGenerated:  12, keysSold:   8, revenue:   6200, joinedReseller: 'May 25, 2026', status: 'active'   },
  { id: 'newseller', username: 'NewSeller', discount: 70, keysGenerated:   0, keysSold:   0, revenue:      0, joinedReseller: 'Jun 1, 2026',  status: 'pending'  },
]

export default function AdminResellersPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = resellers.filter(r =>
    r.username.toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'all' || r.status === filter)
  )

  const totals = {
    active:    resellers.filter(r => r.status === 'active').length,
    pending:   resellers.filter(r => r.status === 'pending').length,
    revenue:   resellers.reduce((s, r) => s + r.revenue, 0),
    keysSold:  resellers.reduce((s, r) => s + r.keysSold, 0),
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Resellers</h1>
          <p className="text-[#9ca3af] text-sm mt-1">Manage the reseller program and approvals.</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />}>Add Reseller</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Resellers',    value: totals.active.toString(),                           color: '#5fcb88', icon: Users     },
          { label: 'Pending Applications',value: totals.pending.toString(),                          color: '#ffae50', icon: Sparkles  },
          { label: 'Total Reseller Revenue', value: `$${(totals.revenue / 100).toLocaleString()}`,   color: '#ff3a00', icon: TrendingUp },
          { label: 'Keys Sold (lifetime)', value: totals.keysSold.toString(),                        color: '#ff5b75', icon: Key       },
        ].map(s => {
          const I = s.icon
          return (
            <Card key={s.label} hover="cyan" className="p-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <I size={16} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
              <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold">{s.label}</p>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input placeholder="Search resellers..." icon={<Search size={14} />} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-full sm:w-44">
          <Select value={filter} onChange={setFilter} options={[
            { value: 'all',      label: 'All'      },
            { value: 'active',   label: 'Active'   },
            { value: 'pending',  label: 'Pending'  },
            { value: 'revoked',  label: 'Revoked'  },
          ]} />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-onyx">
            <thead>
              <tr>
                <th>Reseller</th>
                <th>Discount</th>
                <th>Keys Generated</th>
                <th>Keys Sold</th>
                <th>Sell-through</th>
                <th>Revenue</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const sellThrough = r.keysGenerated > 0 ? Math.round((r.keysSold / r.keysGenerated) * 100) : 0
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.username} size="sm" />
                        <span className="text-white font-semibold text-sm">@{r.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-bold" style={{ color: r.discount >= 80 ? '#5fcb88' : '#ffae50' }}>
                        {r.discount}% off
                      </span>
                    </td>
                    <td className="text-white font-semibold">{r.keysGenerated}</td>
                    <td className="text-white font-semibold">{r.keysSold}</td>
                    <td>
                      <span className={`text-xs font-bold ${sellThrough >= 70 ? 'text-[#5fcb88]' : sellThrough >= 30 ? 'text-[#ffae50]' : 'text-[#9ca3af]'}`}>
                        {sellThrough}%
                      </span>
                    </td>
                    <td className="text-[#5fcb88] font-bold">${(r.revenue / 100).toFixed(2)}</td>
                    <td className="text-xs">{r.joinedReseller}</td>
                    <td>
                      <StatusBadge tone={r.status === 'active' ? 'ok' : r.status === 'pending' ? 'warn' : 'bad'} dot>{r.status}</StatusBadge>
                    </td>
                    <td>
                      {r.status === 'pending'
                        ? (
                          <div className="flex gap-1.5">
                            <Button variant="primary" size="sm" icon={<Check size={11} />} onClick={() => toast({ title: 'Approved', variant: 'success' })}>Approve</Button>
                            <button className="btn btn-icon !text-[#ff5b75]" title="Reject"><X size={11} /></button>
                          </div>
                        )
                        : (
                          <Link href={`/admin/users/${r.id}`} className="btn btn-ghost btn-sm text-[#ff3a00]">
                            Manage <ChevronRight size={12} />
                          </Link>
                        )
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
