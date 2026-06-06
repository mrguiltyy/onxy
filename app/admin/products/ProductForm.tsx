'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Settings2, Tag, Palette, Search, Code, Boxes, Calendar, Infinity as InfinityIcon } from 'lucide-react'
import { createProduct, updateProduct } from './actions'

interface InitialProduct {
  id?:                      string
  name?:                    string
  subtitle?:                string | null
  tagline?:                 string | null
  description?:             string | null
  long_description?:        string | null
  image_url?:               string | null
  gallery_urls?:            string[]
  youtube_url?:             string | null
  demo_url?:                string | null
  category?:                string
  product_type?:            string
  version?:                 string
  status?:                  string
  delivery_method?:         string
  download_url?:            string | null
  featured?:                boolean
  features?:                string[]
  badges?:                  string[]
  cta_label?:               string | null
  cta_color?:               string | null
  accent_color?:            string | null
  requirements?:            string | null
  faq?:                     string | null
  social_proof?:            string | null
  // pricing
  price_day?:               number | null
  price_week?:              number | null
  price_month?:             number | null
  price_lifetime?:          number | null
  original_price_month?:    number | null
  original_price_lifetime?: number | null
  discount_pct?:            number
  reseller_price_day?:      number | null
  reseller_price_week?:     number | null
  reseller_price_month?:    number | null
  reseller_price_lifetime?: number | null
  reseller_open?:           boolean
  reseller_auto_approve?:   boolean
  lifetime_support?:        boolean
  subscription_period?:     string | null
  support_tier?:            string
  requires_review?:         boolean
  stock_limited?:           boolean
  stock_remaining?:         number | null
  // SEO
  meta_title?:              string | null
  meta_description?:        string | null
  meta_keywords?:           string[]
}

const PRODUCT_TYPES = [
  { value: 'tool',         label: 'Tool / software',     hint: 'Compiled program (.exe / DLL)' },
  { value: 'source_code',  label: 'Source code',         hint: 'Zip of source files for download' },
  { value: 'account',      label: 'Account / credentials', hint: 'Pre-made account credentials delivered after purchase' },
  { value: 'subscription', label: 'Subscription',        hint: 'Recurring billing per period' },
  { value: 'flat',         label: 'Flat purchase',       hint: 'One-time digital good' },
  { value: 'bundle',       label: 'Bundle',              hint: 'Multiple products bundled' },
  { value: 'service',      label: 'Service',             hint: 'Setup / hosting / custom work' },
]

const DELIVERY_METHODS = [
  { value: 'instant_key',           label: 'Instant key',           hint: 'Generate a license key immediately on purchase' },
  { value: 'email_delivery',        label: 'Email delivery',        hint: 'Email-only delivery (no dashboard key)' },
  { value: 'manual_review',         label: 'Manual review',         hint: 'Admin approves each delivery' },
  { value: 'download_link',         label: 'Download link',         hint: 'Send a download URL for source/zip' },
  { value: 'account_credentials',   label: 'Account credentials',   hint: 'Deliver pre-saved username/password' },
]

const SUPPORT_TIERS = [
  { value: 'standard',  label: 'Standard',  hint: 'Same support queue as everyone' },
  { value: 'priority',  label: 'Priority',  hint: 'Front of the queue, faster response' },
  { value: 'dedicated', label: 'Dedicated', hint: 'Direct channel with the team' },
]

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
      router.push('/admin/products')
      router.refresh()
    })
  }

  return (
    <form action={onSubmit} className="space-y-6">

      {/* ── BASICS ───────────────────────────────────────────── */}
      <Section title="Basics" icon={<Tag size={13} />}>
        <Field label="Name" required>
          <input name="name" required defaultValue={initial.name ?? ''} className="form-input" />
        </Field>

        <Field label="Subtitle" hint="Short label shown under the title.">
          <input name="subtitle" defaultValue={initial.subtitle ?? ''} placeholder="Premium aimbot / Phoenix Edition" className="form-input" />
        </Field>

        <Field label="Tagline" hint="One-liner shown on cards + above the description.">
          <input name="tagline" defaultValue={initial.tagline ?? ''} placeholder="Auto-update + HWID-locked, ready to resell." className="form-input" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Product type">
            <select name="product_type" defaultValue={initial.product_type ?? 'tool'} className="form-input">
              {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Delivery method">
            <select name="delivery_method" defaultValue={initial.delivery_method ?? 'instant_key'} className="form-input">
              {DELIVERY_METHODS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" hint="Free-form. Used as a tag on cards.">
            <input name="category" defaultValue={initial.category ?? 'tool'} className="form-input" />
          </Field>
          <Field label="Version">
            <input name="version" defaultValue={initial.version ?? '1.0.0'} className="form-input" />
          </Field>
        </div>

        <Field label="Short description (cards + hero)">
          <textarea name="description" rows={4} defaultValue={initial.description ?? ''} className="form-input resize-none font-[inherit]" />
        </Field>

        <Field label="Long description (markdown ok)" hint="Shown on the product page below pricing.">
          <textarea name="long_description" rows={8} defaultValue={initial.long_description ?? ''} className="form-input resize-none font-[inherit]"
            placeholder="## What it does&#10;&#10;Drop-in WPF tool with built-in OP auth...&#10;&#10;## What you get&#10;&#10;- Feature one&#10;- Feature two" />
        </Field>

        <Field label="Features (one per line)" hint="Shown as a green-check list.">
          <textarea name="features" rows={5} defaultValue={(initial.features ?? []).join('\n')} className="form-input resize-none font-[inherit]"
            placeholder="HWID protection&#10;Auto-updater&#10;Discord webhook" />
        </Field>

        <Field label="Requirements / system info (optional)">
          <textarea name="requirements" rows={3} defaultValue={initial.requirements ?? ''} className="form-input resize-none font-[inherit]"
            placeholder="Windows 10+ · .NET 6+ Runtime · 4GB RAM" />
        </Field>

        <Field label="Product-specific FAQ (markdown)">
          <textarea name="faq" rows={4} defaultValue={initial.faq ?? ''} className="form-input resize-none font-[inherit]"
            placeholder="**How long do I get updates?**&#10;Lifetime buyers get every release for free." />
        </Field>

        {isEdit && (
          <Field label="Status">
            <select name="status" defaultValue={initial.status ?? 'active'} className="form-input">
              <option value="active">Active (public)</option>
              <option value="paused">Paused (hidden from /products)</option>
              <option value="discontinued">Discontinued (kept for history)</option>
            </select>
          </Field>
        )}
      </Section>

      {/* ── MEDIA ───────────────────────────────────────────── */}
      <Section title="Media" icon={<Boxes size={13} />}>
        <Field label="Hero image URL" hint="Used as card banner and product page hero.">
          <input name="image_url" defaultValue={initial.image_url ?? ''} placeholder="https://..." className="form-input" />
        </Field>
        <Field label="Gallery URLs (one per line)" hint="Extra screenshots shown below the hero.">
          <textarea name="gallery_urls" rows={3} defaultValue={(initial.gallery_urls ?? []).join('\n')} className="form-input resize-none font-mono text-[12.5px]"
            placeholder="https://...&#10;https://..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="YouTube embed URL" hint="Full YouTube watch URL.">
            <input name="youtube_url" defaultValue={initial.youtube_url ?? ''} placeholder="https://www.youtube.com/watch?v=..." className="form-input" />
          </Field>
          <Field label="Live demo URL">
            <input name="demo_url" defaultValue={initial.demo_url ?? ''} placeholder="https://..." className="form-input" />
          </Field>
        </div>
        <Field label="Download URL" hint="Used when delivery method is download_link or source_code.">
          <input name="download_url" defaultValue={initial.download_url ?? ''} placeholder="https://..." className="form-input" />
        </Field>
      </Section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <Section title="Customer pricing" icon={<Tag size={13} />}>
        <p className="text-[12px] text-[var(--fg-mute)] mb-3">Leave blank to disable that billing option. Set 0 for "free".</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <PriceField name="price_day"      label="1 day"    icon={<Calendar size={11} />}     defaultValue={dollars(initial.price_day)} />
          <PriceField name="price_week"     label="1 week"   icon={<Calendar size={11} />}     defaultValue={dollars(initial.price_week)} />
          <PriceField name="price_month"    label="1 month"  icon={<Calendar size={11} />}     defaultValue={dollars(initial.price_month)} />
          <PriceField name="price_lifetime" label="Lifetime" icon={<InfinityIcon size={11} />} defaultValue={dollars(initial.price_lifetime)} />
        </div>

        <div className="mt-5">
          <p className="text-[12px] text-[var(--fg-mute)] mb-3">Struck-through "was" pricing for sales. Optional.</p>
          <div className="grid grid-cols-2 gap-3">
            <PriceField name="original_price_month"    label="Was — 1 month"  defaultValue={dollars(initial.original_price_month)} />
            <PriceField name="original_price_lifetime" label="Was — Lifetime" defaultValue={dollars(initial.original_price_lifetime)} />
          </div>
        </div>

        <Field label="Sale discount % (display only)" hint="Shows a discount badge on cards. Doesn't change actual price.">
          <input name="discount_pct" type="number" min={0} max={100} defaultValue={initial.discount_pct ?? 0}
            className="form-input tabular-nums w-24" />
        </Field>
      </Section>

      <Section title="Reseller (wholesale) pricing" icon={<Tag size={13} />}>
        <p className="text-[12px] text-[var(--fg-mute)] mb-3">What approved resellers pay per generated key.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <PriceField name="reseller_price_day"      label="1 day"    defaultValue={dollars(initial.reseller_price_day)} />
          <PriceField name="reseller_price_week"     label="1 week"   defaultValue={dollars(initial.reseller_price_week)} />
          <PriceField name="reseller_price_month"    label="1 month"  defaultValue={dollars(initial.reseller_price_month)} />
          <PriceField name="reseller_price_lifetime" label="Lifetime" defaultValue={dollars(initial.reseller_price_lifetime)} />
        </div>

        <div className="flex flex-wrap gap-4 pt-3">
          <Checkbox name="reseller_open"         defaultChecked={initial.reseller_open ?? true}        label="Accept new reseller applications" />
          <Checkbox name="reseller_auto_approve" defaultChecked={initial.reseller_auto_approve}        label="Auto-approve (no manual review)" />
        </div>
      </Section>

      {/* ── CUSTOMIZATION ───────────────────────────────────── */}
      <Section title="Customize the product page" icon={<Palette size={13} />}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CTA button label" hint='Defaults to "Buy now".'>
            <input name="cta_label" defaultValue={initial.cta_label ?? ''} placeholder="Get source code" className="form-input" />
          </Field>
          <Field label="CTA color (hex)" hint="Falls back to brand gradient.">
            <input name="cta_color" defaultValue={initial.cta_color ?? ''} placeholder="#f0a4b7" className="form-input font-mono" />
          </Field>
        </div>

        <Field label="Accent color (hex)" hint="Overrides brand color on the product page only.">
          <input name="accent_color" defaultValue={initial.accent_color ?? ''} placeholder="#a2c8ee" className="form-input font-mono" />
        </Field>

        <Field label="Badges (one per line)" hint="Shown on the product page and cards. Limit ~3.">
          <textarea name="badges" rows={3} defaultValue={(initial.badges ?? []).join('\n')} className="form-input resize-none font-[inherit]"
            placeholder="Hot&#10;Best seller&#10;Limited" />
        </Field>

        <Field label="Social proof string" hint='E.g. "500+ sold this week".'>
          <input name="social_proof" defaultValue={initial.social_proof ?? ''} className="form-input" />
        </Field>

        <div className="flex flex-wrap gap-4 pt-1">
          <Checkbox name="featured"         defaultChecked={initial.featured}                        label="Featured (shown first)" />
          <Checkbox name="lifetime_support" defaultChecked={initial.lifetime_support ?? true}        label="Lifetime support promise" />
          <Checkbox name="requires_review"  defaultChecked={initial.requires_review}                 label="Manual review per purchase" />
        </div>
      </Section>

      {/* ── INVENTORY & SUPPORT ─────────────────────────────── */}
      <Section title="Inventory & support" icon={<Settings2 size={13} />}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Support tier">
            <select name="support_tier" defaultValue={initial.support_tier ?? 'standard'} className="form-input">
              {SUPPORT_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Subscription period" hint="Only matters for subscription type.">
            <select name="subscription_period" defaultValue={initial.subscription_period ?? ''} className="form-input">
              <option value="">— not applicable —</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock-limited">
            <select name="stock_limited" defaultValue={initial.stock_limited ? 'on' : ''} className="form-input">
              <option value="">No (unlimited)</option>
              <option value="on">Yes — limit below</option>
            </select>
          </Field>
          <Field label="Stock remaining">
            <input name="stock_remaining" type="number" min={0} defaultValue={initial.stock_remaining ?? ''}
              className="form-input tabular-nums" placeholder="Leave blank for unlimited" />
          </Field>
        </div>
      </Section>

      {/* ── SEO ─────────────────────────────────────────────── */}
      <Section title="SEO" icon={<Search size={13} />}>
        <Field label="Meta title (override)">
          <input name="meta_title" defaultValue={initial.meta_title ?? ''} className="form-input" />
        </Field>
        <Field label="Meta description (override)" hint="Recommended length 120-160 chars.">
          <textarea name="meta_description" rows={2} maxLength={300} defaultValue={initial.meta_description ?? ''}
            className="form-input resize-none font-[inherit]" />
        </Field>
        <Field label="Meta keywords (comma-separated)">
          <input name="meta_keywords" defaultValue={(initial.meta_keywords ?? []).join(', ')} className="form-input" />
        </Field>
      </Section>

      {error && (
        <div className="text-[12.5px] text-[var(--bad)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-3 sticky bottom-4 z-10">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> {isEdit ? 'Save changes' : 'Create product'}</>}
        </button>
      </div>
    </form>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <p className="label-mono mb-4 flex items-center gap-2"><span className="text-[var(--brand)]">{icon}</span> {title}</p>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label">
        {label}
        {required && <span className="text-[var(--bad)] ml-1">*</span>}
        {hint && <span className="ml-1 text-[var(--fg-mute)] font-normal normal-case tracking-normal text-[11px]">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Checkbox({ name, defaultChecked, label }: { name: string; defaultChecked?: boolean; label: string }) {
  return (
    <label className="flex items-center gap-2 text-[13px] cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-[var(--brand)]" />
      {label}
    </label>
  )
}

function PriceField({ name, label, defaultValue, icon }: { name: string; label: string; defaultValue: string; icon?: React.ReactNode }) {
  return (
    <div>
      <label className="form-label flex items-center gap-1.5">
        {icon} {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--fg-mute)]">$</span>
        <input name={name} type="number" step="0.01" min="0" defaultValue={defaultValue}
          placeholder="0.00" className="form-input pl-7 tabular-nums" />
      </div>
    </div>
  )
}
