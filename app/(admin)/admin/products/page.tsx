'use client'
import { useState } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { UploadZone } from '@/components/ui/UploadZone'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

const products = [
  { id: 1, slug: 'onyx-rage',    name: 'Onyx Rage',    version: 'v2.1.0', category: 'Automation', price:  999, licenses: 234, revenue: '$12,440', active: true,  featured: true,  stock: null },
  { id: 2, slug: 'onyx-stealth', name: 'Onyx Stealth', version: 'v1.4.2', category: 'Stealth',    price: 1499, licenses:  89, revenue: '$7,890',  active: true,  featured: false, stock: null },
  { id: 3, slug: 'onyx-core',    name: 'Onyx Core',    version: 'v3.0.1', category: 'Utility',    price:  699, licenses: 412, revenue: '$18,900', active: true,  featured: true,  stock: null },
  { id: 4, slug: 'onyx-apex',    name: 'Onyx Apex',    version: 'v1.0.3', category: 'Premium',    price: 2999, licenses:  42, revenue: '$8,100',  active: false, featured: false, stock: 10   },
]

export default function ProductsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [category, setCategory] = useState('Automation')
  const { toast } = useToast()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Products</h1>
          <p className="text-[#9ca3af] text-sm mt-1">{products.length} products · {products.filter(p => p.active).length} active</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>New Product</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-onyx">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Licenses</th>
                <th>Revenue</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <p className="text-white font-bold">{p.name}</p>
                    <p className="text-[#6b7280] font-mono text-xs">{p.version}</p>
                  </td>
                  <td><span className="status status-mute">{p.category}</span></td>
                  <td className="text-[#ff3a00] font-bold">${(p.price / 100).toFixed(2)}<span className="text-[#9ca3af] font-normal">/mo</span></td>
                  <td className="text-white font-semibold">{p.licenses.toLocaleString()}</td>
                  <td className="text-[#5fcb88] font-bold">{p.revenue}</td>
                  <td>{p.stock !== null ? <span className="text-[#ffae50] font-bold">{p.stock} left</span> : <span className="text-[#9ca3af]">Unlimited</span>}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={p.active ? 'ok' : 'mute'} dot>{p.active ? 'Active' : 'Hidden'}</StatusBadge>
                      {p.featured && <StatusBadge tone="cyan">Featured</StatusBadge>}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/products/${p.slug}`} className="btn btn-icon"><Edit2 size={12} /></Link>
                      <button className="btn btn-icon" title="Upload new version"><Upload size={12} /></button>
                      <button className="btn btn-icon">{p.active ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                      <button className="btn btn-icon !text-[#ff5b75]"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Product"
        description="Add a new tool to your catalog."
        maxWidth={640}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { setShowCreate(false); toast({ title: 'Product created', variant: 'success' }) }}>Create Product</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Product Name" placeholder="Onyx Blade" />
            <Input label="Slug" placeholder="onyx-blade" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Version" placeholder="v1.0.0" />
            <Select
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { value: 'Automation', label: 'Automation' },
                { value: 'Stealth',    label: 'Stealth'    },
                { value: 'Utility',    label: 'Utility'    },
                { value: 'Premium',    label: 'Premium'    },
              ]}
            />
          </div>
          <Textarea label="Description" rows={3} placeholder="Describe the tool..." />

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] block mb-2">Tool File (.exe)</label>
            <UploadZone accept=".exe" hint="Drag & drop your .exe or browse" />
          </div>

          <div className="flex items-center gap-6 pt-2 border-t border-white/[0.04]">
            <Switch defaultChecked label="Active" description="Visible in store" />
            <Switch label="Featured" description="Show on homepage" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
