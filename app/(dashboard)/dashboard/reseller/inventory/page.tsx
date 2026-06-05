'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Copy, CheckCircle2, X, Download, Plus, Key } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'

interface InvKey {
  id:        string
  key:       string
  product:   string
  plan:      string
  cost:      number
  retail:    number
  status:    'unused' | 'sold' | 'revoked'
  soldPrice?: number
  soldAt?:   string
  createdAt: string
}

const inventory: InvKey[] = [
  { id: '1',  key: 'ONYX-A1B2-C3D4-E5F6-G7H8', product: 'Onyx Rage',    plan: '1 Month',  cost:  250, retail:  999, status: 'unused', createdAt: '2h ago'  },
  { id: '2',  key: 'ONYX-X9Y8-Z7W6-V5U4-T3S2', product: 'Onyx Rage',    plan: '1 Month',  cost:  250, retail:  999, status: 'unused', createdAt: '2h ago'  },
  { id: '3',  key: 'ONYX-Q1W2-E3R4-T5Y6-U7I8', product: 'Onyx Core',    plan: 'Lifetime', cost: 1250, retail: 4999, status: 'sold',   soldPrice: 3500, soldAt: '4h ago', createdAt: '1d ago' },
  { id: '4',  key: 'ONYX-M9N8-B7V6-C5X4-Z3A2', product: 'Onyx Stealth', plan: '3 Months', cost:  875, retail: 3499, status: 'sold',   soldPrice: 2999, soldAt: '8h ago', createdAt: '1d ago' },
  { id: '5',  key: 'ONYX-P1O2-I3U4-Y5T6-R7E8', product: 'Onyx Rage',    plan: 'Lifetime', cost: 1250, retail: 4999, status: 'unused', createdAt: '2d ago' },
  { id: '6',  key: 'ONYX-K1L2-J3H4-G5F6-D7S8', product: 'Onyx Apex',    plan: '1 Month',  cost:  750, retail: 2999, status: 'revoked', createdAt: '3d ago' },
]

export default function InventoryPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')
  const [sellingId, setSellingId] = useState<string | null>(null)
  const [sellPrice, setSellPrice] = useState('')
  const [sellEmail, setSellEmail] = useState('')
  const [page, setPage] = useState(1)

  const products = Array.from(new Set(inventory.map(i => i.product)))

  const filtered = inventory.filter(i =>
    (i.key.toLowerCase().includes(search.toLowerCase()) || i.product.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'all' || i.status === statusFilter) &&
    (productFilter === 'all' || i.product === productFilter)
  )

  const stats = {
    total:    inventory.length,
    unused:   inventory.filter(i => i.status === 'unused').length,
    sold:     inventory.filter(i => i.status === 'sold').length,
    revenue:  inventory.filter(i => i.status === 'sold').reduce((s, i) => s + (i.soldPrice ?? 0), 0),
  }

  const markSold = () => {
    toast({
      title: 'Marked as sold',
      description: `Recorded sale at $${(Number(sellPrice) || 0).toFixed(2)}.`,
      variant: 'success',
    })
    setSellingId(null)
    setSellPrice(''); setSellEmail('')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/dashboard/reseller" className="inline-flex items-center gap-1.5 text-[#9ca3af] hover:text-white text-sm mb-4">
        <ArrowLeft size={13} /> Back to Reseller Hub
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">My Inventory</h1>
          <p className="text-[#9ca3af] text-sm mt-1">All keys you&apos;ve generated. Track sales here.</p>
        </div>
        <Link href="/dashboard/reseller/generate" className="btn btn-primary">
          <Plus size={14} /> Generate More
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Keys', value: stats.total.toString(),    color: '#ff3a00' },
          { label: 'Unused',     value: stats.unused.toString(),   color: '#ffae50' },
          { label: 'Sold',       value: stats.sold.toString(),     color: '#5fcb88' },
          { label: 'Revenue',    value: `$${(stats.revenue / 100).toFixed(2)}`, color: '#ff5b75' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color, letterSpacing: '-0.02em' }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input placeholder="Search keys or products..." icon={<Search size={14} />} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-full sm:w-44">
          <Select value={statusFilter} onChange={setStatusFilter} options={[
            { value: 'all',     label: 'All status' },
            { value: 'unused',  label: 'Unused'     },
            { value: 'sold',    label: 'Sold'       },
            { value: 'revoked', label: 'Revoked'    },
          ]} />
        </div>
        <div className="w-full sm:w-48">
          <Select value={productFilter} onChange={setProductFilter} options={[
            { value: 'all', label: 'All products' },
            ...products.map(p => ({ value: p, label: p })),
          ]} />
        </div>
        <Button variant="outline" icon={<Download size={13} />} className="shrink-0">Export</Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table-onyx">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Product</th>
                  <th>Plan</th>
                  <th>Cost</th>
                  <th>Retail</th>
                  <th>Sold For</th>
                  <th>Profit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(k => {
                  const profit = k.status === 'sold' ? (k.soldPrice ?? 0) - k.cost : null
                  return (
                    <tr key={k.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-[#ff3a00] text-[12px]">{k.key}</code>
                          <button onClick={() => { navigator.clipboard.writeText(k.key); toast({ title: 'Copied', variant: 'success' }) }}
                            className="btn btn-icon !w-6 !h-6 !p-0"
                          >
                            <Copy size={10} />
                          </button>
                        </div>
                      </td>
                      <td className="text-white text-xs font-semibold">{k.product}</td>
                      <td className="text-xs">{k.plan}</td>
                      <td className="text-xs text-white">${(k.cost / 100).toFixed(2)}</td>
                      <td className="text-xs text-[#9ca3af]">${(k.retail / 100).toFixed(2)}</td>
                      <td className="text-xs">
                        {k.soldPrice !== undefined
                          ? <span className="text-white">${(k.soldPrice / 100).toFixed(2)}</span>
                          : <span className="text-[#4b5563]">—</span>
                        }
                      </td>
                      <td className="text-xs">
                        {profit !== null
                          ? <span className="text-[#5fcb88] font-bold">+${(profit / 100).toFixed(2)}</span>
                          : <span className="text-[#4b5563]">—</span>
                        }
                      </td>
                      <td>
                        <StatusBadge tone={k.status === 'sold' ? 'ok' : k.status === 'unused' ? 'warn' : 'bad'} dot>
                          {k.status}
                        </StatusBadge>
                      </td>
                      <td>
                        {k.status === 'unused' && (
                          <Button variant="outline" size="sm" icon={<CheckCircle2 size={11} />} onClick={() => setSellingId(k.id)}>
                            Mark Sold
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Key size={20} />}
            title="No keys match your filters"
            description="Try adjusting search or filters."
          />
        )}
      </Card>

      {inventory.length > 10 && (
        <div className="flex justify-center mt-6">
          <Pagination page={page} totalPages={3} onPageChange={setPage} />
        </div>
      )}

      {/* Mark sold modal */}
      <Modal
        open={sellingId !== null}
        onClose={() => setSellingId(null)}
        title="Mark Key as Sold"
        description="Record the sale to update your revenue stats."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSellingId(null)}>Cancel</Button>
            <Button variant="primary" onClick={markSold}>Confirm Sale</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Sold price (USD)"
            type="number"
            step="0.01"
            placeholder="9.99"
            value={sellPrice}
            onChange={e => setSellPrice(e.target.value)}
            hint="What did you sell the key for?"
          />
          <Input
            label="Buyer email (optional)"
            type="email"
            placeholder="customer@example.com"
            value={sellEmail}
            onChange={e => setSellEmail(e.target.value)}
            hint="For your own records — not shared with Onyx."
          />
        </div>
      </Modal>
    </div>
  )
}
