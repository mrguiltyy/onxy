'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { createProduct, updateProduct } from './actions'

interface InitialProduct {
  id?:                     string
  name?:                   string
  tagline?:                string | null
  description?:            string | null
  image_url?:              string | null
  category?:               string
  version?:                string
  status?:                 string
  featured?:               boolean
  features?:               string[]
  price_day?:              number | null
  price_week?:             number | null
  price_month?:            number | null
  price_lifetime?:         number | null
  reseller_price_day?:     number | null
  reseller_price_week?:    number | null
  reseller_price_month?:   number | null
  reseller_price_lifetime?:number | null
  reseller_open?:          boolean
  reseller_auto_approve?:  boolean
  lifetime_support?:       boolean
}

export function ProductForm({ initial = {} }: { initial?: InitialProduct }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!initial.id

  const dollars = (cents: number | null | undefined) =>
    cents == null ? '' : (cents / 100).toFixed(2)

  function onSubmit(formData: FormData) {
    setError(null)
    start(async () => {
      const res = isEdit
        ? await updateProduct(initial.id!, formData)
        : await createProduct(formData)
      if (!res.ok) { setError(res.error ?? 'Failed.'); return }
      router.push(isEdit ? '/admin/products' : `/admin/products`)
      router.refresh()
    })
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {/* Basics */}
      <section className="card p-5 space-y-4">
        <p className="label-mono">Basics</p>

        <div>
          <label className="form-label">Name</label>
          <input name="name" required defaultValue={initial.name ?? ''} className="form-input" />
        </div>

        <div>
          <label className="form-label">Tagline</label>
          <input name="tagline" defaultValue={initial.tagline ?? ''} placeholder="One-line pitch" className="form-input" />
        </div>

        <div>
          <label className="form-label">Description (markdown ok)</label>
          <textarea name="description" rows={6} defaultValue={initial.description ?? ''} className="form-input resize-none font-[inherit]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Category</label>
            <input name="category" defaultValue={initial.category ?? 'tool'} className="form-input" />
          </div>
          <div>
            <label className="form-label">Version</label>
            <input name="version" defaultValue={initial.version ?? '1.0.0'} className="form-input" />
          </div>
        </div>

        <div>
          <label className="form-label">Image URL</label>
          <input name="image_url" defaultValue={initial.image_url ?? ''} placeholder="https://..." className="form-input" />
        </div>

        <div>
          <label className="form-label">Features <span className="text-[var(--fg-mute)]">(one per line)</span></label>
          <textarea name="features" rows={5} defaultValue={(initial.features ?? []).join('\n')} className="form-input resize-none font-[inherit]" placeholder="HWID protection&#10;Auto-updater&#10;Discord webhook" />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="featured" defaultChecked={initial.featured} className="accent-[var(--brand)]" />
            Featured (shown first)
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="lifetime_support" defaultChecked={initial.lifetime_support ?? true} className="accent-[var(--brand)]" />
            Lifetime support promise
          </label>
        </div>

        {isEdit && (
          <div>
            <label className="form-label">Status</label>
            <select name="status" defaultValue={initial.status ?? 'active'} className="form-input">
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        )}
      </section>

      {/* Customer pricing */}
      <section className="card p-5 space-y-3">
        <p className="label-mono">Customer pricing (USD, leave blank to disable)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <PriceField name="price_day"      label="1 day"      defaultValue={dollars(initial.price_day)} />
          <PriceField name="price_week"     label="1 week"     defaultValue={dollars(initial.price_week)} />
          <PriceField name="price_month"    label="1 month"    defaultValue={dollars(initial.price_month)} />
          <PriceField name="price_lifetime" label="Lifetime"   defaultValue={dollars(initial.price_lifetime)} />
        </div>
      </section>

      {/* Reseller pricing */}
      <section className="card p-5 space-y-3">
        <p className="label-mono">Reseller (wholesale) pricing</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <PriceField name="reseller_price_day"      label="1 day"      defaultValue={dollars(initial.reseller_price_day)} />
          <PriceField name="reseller_price_week"     label="1 week"     defaultValue={dollars(initial.reseller_price_week)} />
          <PriceField name="reseller_price_month"    label="1 month"    defaultValue={dollars(initial.reseller_price_month)} />
          <PriceField name="reseller_price_lifetime" label="Lifetime"   defaultValue={dollars(initial.reseller_price_lifetime)} />
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="reseller_open" defaultChecked={initial.reseller_open ?? true} className="accent-[var(--brand)]" />
            Accept new reseller applications
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="reseller_auto_approve" defaultChecked={initial.reseller_auto_approve} className="accent-[var(--brand)]" />
            Auto-approve (skip manual review)
          </label>
        </div>
      </section>

      {error && (
        <div className="text-[12.5px] text-[var(--bad)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> {isEdit ? 'Save changes' : 'Create product'}</>}
        </button>
      </div>
    </form>
  )
}

function PriceField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--fg-mute)]">$</span>
        <input
          name={name}
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValue}
          placeholder="0.00"
          className="form-input pl-7 tabular-nums"
        />
      </div>
    </div>
  )
}
