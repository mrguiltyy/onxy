'use client'
import { useState } from 'react'
import { Plus, Search, Copy, Trash2, Tag, Package, Wallet, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { Progress } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'

interface RedeemCode {
  code:        string
  reward:      'license' | 'credit' | 'discount'
  rewardDesc:  string
  usesUsed:    number
  usesMax:     number | null
  expiresAt:   string | null
  createdAt:   string
  active:      boolean
}

const codes: RedeemCode[] = [
  { code: 'LAUNCH-WEEK', reward: 'license',  rewardDesc: 'Onyx Core — 7 days',    usesUsed:  47, usesMax: 100,  expiresAt: 'Jun 15, 2026', createdAt: 'May 1, 2026',  active: true  },
  { code: 'SUMMER-25',   reward: 'credit',   rewardDesc: '$25.00 wallet credit',  usesUsed:  12, usesMax: 50,   expiresAt: 'Jul 1, 2026',  createdAt: 'May 28, 2026', active: true  },
  { code: 'WELCOME-NEW', reward: 'discount', rewardDesc: '50% off any product',   usesUsed: 234, usesMax: null, expiresAt: null,           createdAt: 'Jan 1, 2026',  active: true  },
  { code: 'PARTNER-XYZ', reward: 'license',  rewardDesc: 'Onyx Rage — 30 days',   usesUsed:   8, usesMax: 10,   expiresAt: 'Jun 30, 2026', createdAt: 'May 20, 2026', active: true  },
  { code: 'EXPIRED-OLD', reward: 'credit',   rewardDesc: '$10.00 wallet credit',  usesUsed:  88, usesMax: 100,  expiresAt: 'May 1, 2026',  createdAt: 'Apr 1, 2026',  active: false },
]

const rewardMap = {
  license:  { icon: Package, color: '#ff3a00', label: 'License'  },
  credit:   { icon: Wallet,  color: '#5fcb88', label: 'Credit'   },
  discount: { icon: Tag,     color: '#ff5b75', label: 'Discount' },
}

export default function AdminRedeemPage() {
  const { toast } = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  // Create form state
  const [reward,      setReward]      = useState('license')
  const [bulkMode,    setBulkMode]    = useState(false)
  const [usesMaxKind, setUsesMaxKind] = useState('limited')

  const filtered = codes.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'all' || (filter === 'active' && c.active) || (filter === 'expired' && !c.active))
  )

  const copy = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: 'Code copied', description: code, variant: 'success' })
  }

  const create = () => {
    setShowCreate(false)
    toast({
      title: bulkMode ? '500 codes generated' : 'Code created',
      description: bulkMode ? 'Download the CSV from the actions menu.' : 'New code is now redeemable.',
      variant: 'success',
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Redeem Codes</h1>
          <p className="text-[#9ca3af] text-sm mt-1">{codes.length} codes · {codes.filter(c => c.active).length} active</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          Create Code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Codes',    value: codes.length.toString(),                                       color: '#ff3a00', icon: Tag },
          { label: 'Active',         value: codes.filter(c => c.active).length.toString(),                color: '#5fcb88', icon: Sparkles },
          { label: 'Total Redeemed', value: codes.reduce((a, c) => a + c.usesUsed, 0).toLocaleString(),   color: '#ff5b75', icon: Package },
          { label: 'Avg Usage Rate', value: '47%',                                                         color: '#ffae50', icon: Wallet },
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
          <Input placeholder="Search codes..." icon={<Search size={14} />} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all',     label: 'All codes' },
              { value: 'active',  label: 'Active'    },
              { value: 'expired', label: 'Expired'   },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-onyx">
            <thead>
              <tr>
                <th>Code</th>
                <th>Reward</th>
                <th>Usage</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const r = rewardMap[c.reward]
                const I = r.icon
                const pct = c.usesMax ? (c.usesUsed / c.usesMax) * 100 : 0
                return (
                  <tr key={c.code}>
                    <td>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-[#ff3a00] font-bold">{c.code}</code>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${r.color}15`, border: `1px solid ${r.color}25` }}>
                          <I size={11} style={{ color: r.color }} />
                        </div>
                        <span className="text-white text-xs">{c.rewardDesc}</span>
                      </div>
                    </td>
                    <td>
                      <div className="min-w-[140px]">
                        <p className="text-[12px] text-white mb-1.5">
                          {c.usesUsed} / {c.usesMax ?? '∞'}
                        </p>
                        {c.usesMax && <Progress value={pct} />}
                      </div>
                    </td>
                    <td className="text-xs">{c.expiresAt ?? <span className="text-[#6b7280]">Never</span>}</td>
                    <td>
                      <StatusBadge tone={c.active ? 'ok' : 'mute'} dot>{c.active ? 'Active' : 'Expired'}</StatusBadge>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button className="btn btn-icon" onClick={() => copy(c.code)} title="Copy"><Copy size={11} /></button>
                        <button className="btn btn-icon !text-[#ff5b75]" title="Delete"><Trash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Redeem Code"
        description="Generate a single code or bulk create up to 1,000 unique codes."
        maxWidth={560}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={create}>
              {bulkMode ? 'Generate Codes' : 'Create Code'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Switch
            checked={bulkMode}
            onChange={e => setBulkMode(e.target.checked)}
            label="Bulk generate"
            description="Generate multiple unique codes at once."
          />

          {bulkMode ? (
            <Input label="Number of codes" type="number" min="2" max="1000" defaultValue="100" />
          ) : (
            <Input label="Code (leave blank to auto-generate)" placeholder="LAUNCH-WEEK" />
          )}

          <Select
            label="Reward Type"
            value={reward}
            onChange={setReward}
            options={[
              { value: 'license',  label: 'License Access' },
              { value: 'credit',   label: 'Wallet Credit'  },
              { value: 'discount', label: 'Discount'       },
            ]}
          />

          {reward === 'license' && (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Product"
                value="onyx-core"
                onChange={() => {}}
                options={[
                  { value: 'onyx-core',    label: 'Onyx Core'    },
                  { value: 'onyx-rage',    label: 'Onyx Rage'    },
                  { value: 'onyx-stealth', label: 'Onyx Stealth' },
                ]}
              />
              <Select
                label="Duration"
                value="7d"
                onChange={() => {}}
                options={[
                  { value: '1d',  label: '1 Day'    },
                  { value: '7d',  label: '7 Days'   },
                  { value: '30d', label: '30 Days'  },
                  { value: 'inf', label: 'Lifetime' },
                ]}
              />
            </div>
          )}

          {reward === 'credit' && <Input label="Credit Amount (USD)" type="number" step="0.01" placeholder="25.00" />}

          {reward === 'discount' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Discount %" type="number" min="1" max="100" placeholder="20" />
              <Input label="Valid for (hours)" type="number" placeholder="24" />
            </div>
          )}

          <div className="div-tagged">
            <span className="text-[10px] mono text-[#6b7280] tracking-wider">USAGE LIMITS</span>
          </div>

          <Select
            label="Max Uses (global)"
            value={usesMaxKind}
            onChange={setUsesMaxKind}
            options={[
              { value: 'limited',   label: 'Limited number of uses' },
              { value: 'unlimited', label: 'Unlimited'              },
            ]}
          />

          {usesMaxKind === 'limited' && (
            <Input label="Max total uses" type="number" placeholder="100" />
          )}

          <Input label="Expiration Date (optional)" type="date" />
        </div>
      </Modal>
    </div>
  )
}
