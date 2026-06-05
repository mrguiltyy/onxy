'use client'
import { useState } from 'react'
import { Plus, GripVertical, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'

interface Category {
  id:        string
  slug:      string
  name:      string
  blurb:     string
  productCount: number
  sortOrder: number
  active:    boolean
  accent:    string
}

const initial: Category[] = [
  { id: '1', slug: 'automation', name: 'Automation', blurb: 'Tools that do the work for you.',          productCount: 3, sortOrder: 1, active: true,  accent: '#ff3a00' },
  { id: '2', slug: 'stealth',    name: 'Stealth',    blurb: 'Move undetected, leave no trace.',        productCount: 2, sortOrder: 2, active: true,  accent: '#ff5b75' },
  { id: '3', slug: 'utility',    name: 'Utility',    blurb: 'Companions for the rest of your kit.',    productCount: 2, sortOrder: 3, active: true,  accent: '#5fcb88' },
  { id: '4', slug: 'premium',    name: 'Premium',    blurb: 'Elite tier — reserved for the few.',      productCount: 2, sortOrder: 4, active: true,  accent: '#ffae50' },
  { id: '5', slug: 'experimental', name: 'Experimental', blurb: 'In active development.',              productCount: 0, sortOrder: 5, active: false, accent: '#a78bff' },
]

export default function AdminCategoriesPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Category[]>(initial)
  const [open, setOpen]   = useState(false)

  // Form state
  const [name,   setName]   = useState('')
  const [slug,   setSlug]   = useState('')
  const [blurb,  setBlurb]  = useState('')
  const [accent, setAccent] = useState('#ff3a00')

  const create = () => {
    if (!name || !slug) return
    setItems([...items, {
      id:           crypto.randomUUID(),
      name, slug, blurb, accent,
      productCount: 0,
      sortOrder:    items.length + 1,
      active:       true,
    }])
    setOpen(false)
    setName(''); setSlug(''); setBlurb('')
    toast({ title: 'Category created', variant: 'success' })
  }

  const toggleActive = (id: string) => {
    setItems(items.map(it => it.id === id ? { ...it, active: !it.active } : it))
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Product Categories</h1>
          <p className="text-[var(--fg-dim)] text-sm mt-1">
            Categories shown on the store, in the slideshow rail, and in admin product filters.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
          New Category
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--hairline)]">
          <p className="text-[var(--fg)] font-semibold">Sort order</p>
          <p className="text-[var(--fg-mute)] text-xs mt-0.5">Drag to reorder how categories appear on the storefront. Disabled categories are hidden but keep their products attached.</p>
        </div>

        <div className="divide-y divide-[var(--hairline)]">
          {[...items].sort((a, b) => a.sortOrder - b.sortOrder).map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4">
              <GripVertical size={14} className="text-[var(--fg-faint)] shrink-0 cursor-grab" />

              <div className="w-2 h-12 rounded-sm" style={{ background: c.accent }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[var(--fg)] font-semibold">{c.name}</p>
                  <code className="font-mono text-[10.5px] text-[var(--fg-mute)]">{c.slug}</code>
                </div>
                <p className="text-[var(--fg-dim)] text-xs mt-0.5">{c.blurb}</p>
              </div>

              <span className="font-mono text-[11px] text-[var(--fg-mute)]">{c.productCount} products</span>

              <StatusBadge tone={c.active ? 'ok' : 'mute'} dot>{c.active ? 'Active' : 'Hidden'}</StatusBadge>

              <div className="flex items-center gap-1">
                <button className="btn btn-icon" title={c.active ? 'Hide' : 'Show'} onClick={() => toggleActive(c.id)}>
                  {c.active ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
                <button className="btn btn-icon" title="Edit"><Edit2 size={11} /></button>
                <button className="btn btn-icon" title="Delete" style={{ color: 'var(--bad)' }}><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create category"
        description="A new product group. Products are assigned to it via the product editor."
        maxWidth={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={create} disabled={!name || !slug}>Create</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Display name"
              placeholder="Stealth"
              value={name}
              onChange={e => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')) }}
            />
            <Input label="Slug"
              placeholder="stealth"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              hint="lowercase, dashes only"
            />
          </div>
          <Textarea label="Tagline"
            rows={2}
            placeholder="Move undetected, leave no trace."
            value={blurb}
            onChange={e => setBlurb(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--fg-mute)]">Accent color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accent}
                onChange={e => setAccent(e.target.value)}
                className="w-10 h-10 rounded-md border border-[var(--hairline-2)] bg-[var(--bg-2)] cursor-pointer"
              />
              <code className="font-mono text-sm" style={{ color: accent }}>{accent}</code>
            </div>
          </div>
          <div className="pt-2 border-t border-[var(--hairline)]">
            <Switch defaultChecked label="Visible on storefront" description="Hidden categories keep their products but don't appear in filters." />
          </div>
        </div>
      </Modal>
    </div>
  )
}
