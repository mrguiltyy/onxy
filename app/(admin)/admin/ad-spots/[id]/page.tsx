'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Plus, Edit2, Pause, Play, Trash2, Eye, MousePointer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

// Demo data — replace with Supabase query in Phase 2.
const spot = {
  id: '1', slot_key: 'hero-banner', name: 'Hero Banner — Homepage',
  location: 'Above the fold on /',
  w: 1200, h: 240, basePrice: 25000, active: true,
}

const campaigns = [
  { id: 'c1', advertiser: 'NightOwl Hosting',   email: 'biz@nightowl.gg',    paid: 25000, starts: 'Jun 1', ends: 'Jul 1',  status: 'active',    impr: 18402, clicks: 244 },
  { id: 'c2', advertiser: 'Crypto Coffee Co.', email: 'ads@cryptocoffee.io',paid: 18000, starts: 'May 8', ends: 'Jun 8',  status: 'ended',     impr: 30010, clicks: 368 },
  { id: 'c3', advertiser: 'BlackBox VPN',      email: 'hello@blackbox.vpn', paid: 15000, starts: 'Jul 5', ends: 'Aug 5',  status: 'scheduled', impr: 0,     clicks: 0   },
]

export default function AdSpotDetailPage() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const ctr = campaigns.reduce((s, c) => s + c.impr, 0) > 0
    ? ((campaigns.reduce((s, c) => s + c.clicks, 0) / campaigns.reduce((s, c) => s + c.impr, 0)) * 100).toFixed(2)
    : '0.00'

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/admin/ad-spots" className="inline-flex items-center gap-1 text-[var(--fg-mute)] hover:text-[var(--fg)] text-sm mb-4 transition-colors">
        <ChevronLeft size={14} /> Back to ad spots
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-white font-bold text-2xl tracking-tight">{spot.name}</h1>
            <StatusBadge tone={spot.active ? 'ok' : 'mute'} dot>{spot.active ? 'Active' : 'Disabled'}</StatusBadge>
          </div>
          <p className="text-[var(--fg-dim)] text-sm">{spot.location}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            <span className="font-mono text-[var(--fg-mute)]">key: {spot.slot_key}</span>
            <span className="text-[var(--fg-mute)]">·</span>
            <span className="font-mono text-[var(--fg-mute)]">{spot.w}×{spot.h}</span>
            <span className="text-[var(--fg-mute)]">·</span>
            <span className="text-[var(--c)] font-semibold">${(spot.basePrice / 100).toFixed(0)}/mo base</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Edit2 size={13} />}>Edit Spot</Button>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>New Campaign</Button>
        </div>
      </div>

      {/* Performance summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active campaigns', value: campaigns.filter(c => c.status === 'active').length.toString() },
          { label: 'Lifetime revenue', value: `$${(campaigns.reduce((s, c) => s + c.paid, 0) / 100).toLocaleString()}` },
          { label: 'Impressions',      value: campaigns.reduce((s, c) => s + c.impr, 0).toLocaleString(),  sub: 'all-time' },
          { label: 'CTR',              value: `${ctr}%` },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="label-mono mb-2">{s.label}</p>
            <p className="text-[var(--fg)] text-xl font-bold" style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
            {s.sub && <p className="text-[var(--fg-mute)] text-xs mt-1">{s.sub}</p>}
          </Card>
        ))}
      </div>

      {/* Campaigns table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[var(--hairline)]">
          <h2 className="text-[var(--fg)] font-bold">Campaigns</h2>
          <p className="text-[var(--fg-mute)] text-xs mt-0.5">All campaigns scheduled, running, or ended on this spot.</p>
        </div>
        <table className="table-onyx">
          <thead>
            <tr>
              <th>Advertiser</th>
              <th>Window</th>
              <th>Paid</th>
              <th>Performance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => {
              const localCtr = c.impr > 0 ? ((c.clicks / c.impr) * 100).toFixed(2) : '0.00'
              return (
                <tr key={c.id}>
                  <td>
                    <p className="text-[var(--fg)] font-semibold">{c.advertiser}</p>
                    <p className="text-[var(--fg-mute)] text-xs">{c.email}</p>
                  </td>
                  <td className="text-xs">{c.starts} → {c.ends}, 2026</td>
                  <td className="text-[var(--c)] font-bold">${(c.paid / 100).toLocaleString()}</td>
                  <td>
                    <div className="text-xs flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[var(--fg-dim)]"><Eye size={11} /> {c.impr.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-[var(--fg-dim)]"><MousePointer size={11} /> {c.clicks.toLocaleString()}</span>
                      <span className="text-[var(--fg-mute)]">({localCtr}% CTR)</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge
                      tone={c.status === 'active' ? 'ok' : c.status === 'scheduled' ? 'warn' : 'mute'}
                      dot
                    >
                      {c.status}
                    </StatusBadge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {c.status === 'active' && (
                        <button className="btn btn-icon" title="Pause"><Pause size={11} /></button>
                      )}
                      {c.status === 'scheduled' && (
                        <button className="btn btn-icon" title="Start now"><Play size={11} /></button>
                      )}
                      <button className="btn btn-icon"><Edit2 size={11} /></button>
                      <button className="btn btn-icon" style={{ color: 'var(--bad)' }}><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Campaign"
        description="Schedule a new advertiser rental on this spot."
        maxWidth={560}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { setOpen(false); toast({ title: 'Campaign scheduled', variant: 'success' }) }}>Schedule Campaign</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Advertiser name" placeholder="NightOwl Hosting" />
            <Input label="Contact email"   placeholder="biz@nightowl.gg" type="email" />
          </div>
          <Input label="Click URL" type="url" placeholder="https://nightowl.gg" />
          <Input label="Image URL (optional)" type="url" placeholder="https://cdn.example.com/banner.png" hint="Recommended size matches the spot dimensions" />
          <Textarea label="Alt text / fallback copy" rows={2} placeholder="Fast servers built for game streamers." />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Start date" type="date" />
            <Input label="End date"   type="date" />
            <Input label="Paid amount" type="number" step="0.01" suffix="USD" placeholder="250.00" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
