'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Key, Wallet, Minus, Plus, Sparkles, Copy, Download, AlertCircle, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { StatusBadge } from '@/components/ui/StatusBadge'

const products = [
  { slug: 'onyx-rage',    name: 'Onyx Rage',    accent: '#ff3a00' },
  { slug: 'onyx-stealth', name: 'Onyx Stealth', accent: '#ff5b75' },
  { slug: 'onyx-core',    name: 'Onyx Core',    accent: '#5fcb88' },
  { slug: 'onyx-apex',    name: 'Onyx Apex',    accent: '#ffae50' },
  { slug: 'onyx-pulse',   name: 'Onyx Pulse',   accent: '#5b8def' },
  { slug: 'onyx-blade',   name: 'Onyx Blade',   accent: '#ff5fb2' },
]

const plansByProduct: Record<string, { id: string; label: string; retail: number }[]> = {
  'onyx-rage':    [{ id: 'monthly', label: '1 Month', retail:  999 }, { id: 'quarterly', label: '3 Months', retail: 2499 }, { id: 'lifetime', label: 'Lifetime', retail: 4999 }],
  'onyx-stealth': [{ id: 'monthly', label: '1 Month', retail: 1499 }, { id: 'quarterly', label: '3 Months', retail: 3499 }, { id: 'lifetime', label: 'Lifetime', retail: 6999 }],
  'onyx-core':    [{ id: 'monthly', label: '1 Month', retail:  699 }, { id: 'quarterly', label: '3 Months', retail: 1799 }, { id: 'lifetime', label: 'Lifetime', retail: 3499 }],
  'onyx-apex':    [{ id: 'monthly', label: '1 Month', retail: 2999 }, { id: 'lifetime', label: 'Lifetime', retail: 9999 }],
  'onyx-pulse':   [{ id: 'monthly', label: '1 Month', retail:  499 }, { id: 'quarterly', label: '3 Months', retail: 1199 }],
  'onyx-blade':   [{ id: 'monthly', label: '1 Month', retail: 1799 }, { id: 'lifetime', label: 'Lifetime', retail: 5999 }],
}

const DISCOUNT_PERCENT = 75
const walletBalance   = 32480 // cents

function generateKey(): string {
  const seg = () => Math.random().toString(36).toUpperCase().slice(2, 6)
  return `ONYX-${seg()}-${seg()}-${seg()}-${seg()}`
}

export default function GenerateKeysPage() {
  const { toast } = useToast()
  const [productSlug, setProductSlug] = useState('onyx-rage')
  const [planId, setPlanId]   = useState('monthly')
  const [qty, setQty]         = useState(5)
  const [generated, setGenerated] = useState<string[]>([])

  const product = products.find(p => p.slug === productSlug)!
  const plans = plansByProduct[productSlug]
  const plan  = plans.find(p => p.id === planId) ?? plans[0]
  const unitCost = Math.round(plan.retail * (1 - DISCOUNT_PERCENT / 100))
  const totalCost = unitCost * qty
  const profitPerKey = plan.retail - unitCost
  const totalProfit = profitPerKey * qty
  const canAfford = walletBalance >= totalCost

  const generate = async () => {
    if (!canAfford) {
      toast({ title: 'Insufficient balance', description: 'Top up your wallet to continue.', variant: 'error' })
      return
    }
    await new Promise(r => setTimeout(r, 500))
    const newKeys = Array.from({ length: qty }, generateKey)
    setGenerated(newKeys)
    toast({ title: `${qty} keys generated`, description: `Total cost: $${(totalCost / 100).toFixed(2)}`, variant: 'success' })
  }

  const copyAll = () => {
    navigator.clipboard.writeText(generated.join('\n'))
    toast({ title: `${generated.length} keys copied`, variant: 'success' })
  }

  const exportCsv = () => {
    const csv = `Key,Product,Plan,Cost,Retail\n${generated.map(k =>
      `${k},${product.name},${plan.label},${(unitCost / 100).toFixed(2)},${(plan.retail / 100).toFixed(2)}`
    ).join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `onyx-keys-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/dashboard/reseller" className="inline-flex items-center gap-1.5 text-[#9ca3af] hover:text-white text-sm mb-4">
        <ArrowLeft size={13} /> Back to Reseller Hub
      </Link>

      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl tracking-tight">Generate License Keys</h1>
        <p className="text-[#9ca3af] text-sm mt-1">Pay {(100 - DISCOUNT_PERCENT)}% of retail. Sell at any price you want.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Configurator */}
        <Card className="lg:col-span-3 p-6">
          <h3 className="section-h-title mb-5 flex items-center gap-2"><Key size={15} className="text-[#ff3a00]" /> Configuration</h3>

          {/* Product picker grid */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] mb-3">Product</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.map(p => (
                <button
                  key={p.slug}
                  onClick={() => { setProductSlug(p.slug); setPlanId(plansByProduct[p.slug][0].id) }}
                  className={`relative p-3 rounded-lg border text-left transition-all overflow-hidden group ${
                    productSlug === p.slug
                      ? 'border-[rgba(255,58,0,0.35)] bg-[rgba(255,58,0,0.06)]'
                      : 'border-white/[0.06] bg-[#0e1119] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-[20px] opacity-40 pointer-events-none"
                    style={{ background: p.accent, transform: 'translate(8px, -8px)' }}
                  />
                  <div className="relative">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center mb-2"
                      style={{ background: `${p.accent}20`, border: `1px solid ${p.accent}30` }}
                    >
                      <span className="text-[11px] font-black text-white" style={{ textShadow: `0 0 8px ${p.accent}` }}>
                        {p.name.replace('Onyx ', '').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white font-semibold text-[13px]">{p.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Plan + Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <Select
              label="Plan"
              value={planId}
              onChange={setPlanId}
              options={plans.map(p => ({ value: p.id, label: `${p.label} — $${(p.retail / 100).toFixed(2)} retail` }))}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Quantity</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="btn btn-icon">
                  <Minus size={13} />
                </button>
                <input type="number" min="1" max="1000" value={qty}
                  onChange={e => setQty(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="input-onyx text-center font-mono font-bold text-base"
                />
                <button onClick={() => setQty(q => Math.min(1000, q + 1))} className="btn btn-icon">
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick qty buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[1, 5, 10, 25, 50, 100].map(n => (
              <button key={n} onClick={() => setQty(n)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                  qty === n
                    ? 'bg-[rgba(255,58,0,0.1)] border-[rgba(255,58,0,0.3)] text-[#ff3a00]'
                    : 'bg-[#0e1119] border-white/[0.06] text-[#9ca3af] hover:border-white/[0.15] hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Insufficient warning */}
          {!canAfford && (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-[rgba(255,91,117,0.2)] bg-[rgba(255,91,117,0.05)] mb-4">
              <AlertCircle size={14} className="text-[#ff5b75] mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="text-[#ff5b75] font-semibold">Insufficient wallet balance</p>
                <p className="text-[#9ca3af] mt-0.5">You need ${((totalCost - walletBalance) / 100).toFixed(2)} more to generate.</p>
                <Link href="/dashboard/wallet" className="text-[#ff3a00] hover:underline mt-1 inline-block">Top up wallet →</Link>
              </div>
            </div>
          )}

          <Button variant="primary" onClick={generate} disabled={!canAfford} className="w-full !py-3.5" icon={<Sparkles size={15} />}>
            Generate {qty} {qty === 1 ? 'Key' : 'Keys'} — ${(totalCost / 100).toFixed(2)}
          </Button>
        </Card>

        {/* Cost calculator */}
        <Card className="lg:col-span-2 p-6 relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] pointer-events-none"
            style={{ background: 'rgba(95,203,136,0.1)', transform: 'translate(20px, -20px)' }}
          />

          <div className="relative">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={15} className="text-[#5fcb88]" />
              <h3 className="section-h-title">Profit Calculator</h3>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
                <span className="text-xs text-[#9ca3af]">Retail price / key</span>
                <span className="text-white font-bold text-sm">${(plan.retail / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
                <span className="text-xs text-[#9ca3af]">Your discount</span>
                <StatusBadge tone="warn">{DISCOUNT_PERCENT}% off</StatusBadge>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
                <span className="text-xs text-[#9ca3af]">Your cost / key</span>
                <span className="text-[#ff3a00] font-bold text-sm">${(unitCost / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
                <span className="text-xs text-[#9ca3af]">Profit / key (at retail)</span>
                <span className="text-[#5fcb88] font-bold text-sm">${(profitPerKey / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
                <span className="text-xs text-[#9ca3af]">Quantity</span>
                <span className="text-white font-bold text-sm">× {qty}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#6b7280]">Total cost</span>
                <span className="text-white font-semibold">${(totalCost / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/[0.08]">
                <span className="text-sm text-white font-semibold">Max profit</span>
                <span className="text-2xl font-bold text-[#5fcb88]" style={{ letterSpacing: '-0.025em' }}>
                  +${(totalProfit / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-md bg-[rgba(255,58,0,0.04)] border border-[rgba(255,58,0,0.1)]">
              <div className="flex items-center gap-2 text-xs">
                <Wallet size={11} className="text-[#ff3a00]" />
                <span className="text-[#9ca3af]">Wallet balance</span>
                <span className="text-[#ff3a00] font-bold ml-auto">${(walletBalance / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Generated keys output */}
      {generated.length > 0 && (
        <Card className="mt-6 p-6 animate-fade-up border" style={{ borderColor: 'rgba(95,203,136,0.25)', background: 'linear-gradient(135deg, rgba(95,203,136,0.04), rgba(20,24,35,0.6))' }}>
          <div className="section-h">
            <h3 className="section-h-title flex items-center gap-2">
              <Sparkles size={15} className="text-[#5fcb88]" /> {generated.length} Keys Generated
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Copy size={12} />} onClick={copyAll}>Copy All</Button>
              <Button variant="outline" size="sm" icon={<Download size={12} />} onClick={exportCsv}>Export CSV</Button>
            </div>
          </div>

          <div className="bg-[#06080d] border border-white/[0.04] rounded-lg p-4 max-h-[300px] overflow-y-auto">
            <div className="flex flex-col gap-1">
              {generated.map((k, i) => (
                <div key={k} className="flex items-center gap-3 text-xs">
                  <span className="text-[#4b5563] font-mono w-6 text-right">{i + 1}.</span>
                  <code className="font-mono text-[#5fcb88] tracking-wider flex-1">{k}</code>
                  <button onClick={() => { navigator.clipboard.writeText(k); toast({ title: 'Copied', variant: 'success' }) }}
                    className="text-[#6b7280] hover:text-[#ff3a00] transition-colors"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-[#6b7280] mt-3">
            Keys saved to your inventory. Mark them as sold in the <Link href="/dashboard/reseller/inventory" className="text-[#ff3a00] hover:underline">inventory page</Link> to track revenue.
          </p>
        </Card>
      )}
    </div>
  )
}
