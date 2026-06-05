'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Eye, MousePointer, DollarSign, Megaphone, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

// Will be replaced by a real Supabase query in Phase 2 wiring.
const spots = [
  { id: '1', slot_key: 'hero-banner',     name: 'Hero Banner — Homepage',  location: 'Above the fold on /',                     w: 1200, h: 240, basePrice: 25000, active: true,  activeCampaigns: 1, revenue: 25000, impressions:  48412, clicks: 612 },
  { id: '2', slot_key: 'shop-rail',       name: 'Shop Sidebar Rail',       location: 'Right rail on /shop and product pages',   w:  320, h: 480, basePrice: 12000, active: true,  activeCampaigns: 2, revenue: 24000, impressions: 124800, clicks: 421 },
  { id: '3', slot_key: 'footer-strip',    name: 'Footer Strip — Sitewide', location: 'Above the footer on every page',          w: 1200, h: 120, basePrice:  8000, active: true,  activeCampaigns: 0, revenue:     0, impressions:      0, clicks:   0 },
  { id: '4', slot_key: 'dashboard-promo', name: 'Dashboard Promo Card',    location: 'Top of /dashboard',                       w:  600, h: 200, basePrice: 18000, active: false, activeCampaigns: 0, revenue: 36000, impressions:  18204, clicks:  92 },
]

export default function AdSpotsPage() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const totalRevenue   = spots.reduce((s, x) => s + x.revenue,      0)
  const totalImpr      = spots.reduce((s, x) => s + x.impressions,  0)
  const totalClicks    = spots.reduce((s, x) => s + x.clicks,       0)
  const activeCount    = spots.filter(s => s.active).length

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Ad Spots</h1>
          <p className="text-[var(--fg-dim)] text-sm mt-1">Rentable inventory across the site. Manage spots, campaigns, and revenue.</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>New Ad Spot</Button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Spots',  value: spots.length.toString(),                       sub: `${activeCount} active`,                icon: Megaphone     },
          { label: 'Revenue (MTD)',value: `$${(totalRevenue / 100).toLocaleString()}`,   sub: 'Across all spots',                     icon: DollarSign    },
          { label: 'Impressions',  value: totalImpr.toLocaleString(),                    sub: 'Lifetime',                             icon: Eye           },
          { label: 'Clicks',       value: totalClicks.toLocaleString(),                  sub: `CTR ${totalImpr > 0 ? ((totalClicks/totalImpr)*100).toFixed(2) : '0.00'}%`, icon: MousePointer },
        ].map(s => {
          const I = s.icon
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--c-faint)', border: '1px solid var(--c-dim)' }}>
                  <I size={14} className="text-[var(--c)]" />
                </div>
                <span className="label-mono">{s.label}</span>
              </div>
              <p className="text-[var(--fg)] text-2xl font-bold" style={{ letterSpacing: '-0.025em' }}>{s.value}</p>
              <p className="text-[var(--fg-mute)] text-xs mt-1">{s.sub}</p>
            </Card>
          )
        })}
      </div>

      {/* Spots table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-onyx">
            <thead>
              <tr>
                <th>Spot</th>
                <th>Location</th>
                <th>Size</th>
                <th>Base Price</th>
                <th>Campaigns</th>
                <th>Performance</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {spots.map(s => (
                <tr key={s.id}>
                  <td>
                    <p className="text-[var(--fg)] font-semibold">{s.name}</p>
                    <code className="font-mono text-[10.5px] text-[var(--fg-mute)]">{s.slot_key}</code>
                  </td>
                  <td className="text-[var(--fg-dim)] text-xs">{s.location}</td>
                  <td className="font-mono text-xs">{s.w}×{s.h}</td>
                  <td className="text-[var(--c)] font-bold">${(s.basePrice / 100).toFixed(0)}<span className="text-[var(--fg-mute)] font-normal text-xs">/mo</span></td>
                  <td className="font-bold">{s.activeCampaigns}</td>
                  <td>
                    <div className="text-xs">
                      <span className="text-[var(--fg)]">{s.impressions.toLocaleString()}</span>
                      <span className="text-[var(--fg-mute)]"> impr · </span>
                      <span className="text-[var(--fg)]">{s.clicks.toLocaleString()}</span>
                      <span className="text-[var(--fg-mute)]"> clk</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge tone={s.active ? 'ok' : 'mute'} dot>{s.active ? 'Active' : 'Disabled'}</StatusBadge>
                  </td>
                  <td>
                    <Link href={`/admin/ad-spots/${s.id}`} className="btn btn-ghost btn-sm text-[var(--c)] flex items-center gap-1">
                      Manage <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Ad Spot"
        description="Define a new rentable inventory slot."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { setOpen(false); toast({ title: 'Spot created', variant: 'success' }) }}>Create Spot</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name"     placeholder="Hero Banner — Homepage" />
            <Input label="Slot key" placeholder="hero-banner" hint="lowercase-dashes only" />
          </div>
          <Textarea label="Location description" rows={2} placeholder="Above the fold on /" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Width (px)"  type="number" placeholder="1200" />
            <Input label="Height (px)" type="number" placeholder="240" />
            <Input label="Base price"  type="number" step="0.01" placeholder="250.00" suffix="USD" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
