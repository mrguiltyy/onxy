'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Loader2, Tag, Boxes, Wallet, Image as ImageIcon, FileText, Eye } from 'lucide-react'
import { createProductSimple } from './actions'
import { ImagePicker } from '../ImagePicker'

const STEPS = [
  { n: 1, label: 'Basics',     icon: Tag },
  { n: 2, label: 'Image',      icon: ImageIcon },
  { n: 3, label: 'Pricing',    icon: Wallet },
  { n: 4, label: 'Details',    icon: FileText },
  { n: 5, label: 'Review',     icon: Eye },
]

const TYPES = [
  { value: 'tool',         label: 'Tool / software',     hint: 'A program your customers run' },
  { value: 'source_code',  label: 'Source code',         hint: 'A zip of source files' },
  { value: 'account',      label: 'Account credentials', hint: 'Pre-made account info' },
  { value: 'subscription', label: 'Subscription',        hint: 'Recurring access' },
]

export function ProductWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [productType, setProductType] = useState('tool')
  const [imageUrl, setImageUrl] = useState('')
  const [priceDollars, setPriceDollars] = useState('')   // customer lifetime price
  const [resellerPriceDollars, setResellerPriceDollars] = useState('')  // wholesale
  const [description, setDescription] = useState('')
  const [featuresText, setFeaturesText] = useState('')

  function next() {
    setError(null)
    // Validate per step
    if (step === 1 && (!name.trim() || name.length < 2)) {
      setError('Give it a name (at least 2 characters).')
      return
    }
    if (step === 3 && (!priceDollars || parseFloat(priceDollars) <= 0)) {
      setError('Set a customer price (greater than $0).')
      return
    }
    setStep(s => Math.min(STEPS.length, s + 1))
  }

  function back() {
    setError(null)
    setStep(s => Math.max(1, s - 1))
  }

  function publish() {
    setError(null)
    start(async () => {
      const price = Math.round(parseFloat(priceDollars) * 100)
      const wholesale = resellerPriceDollars
        ? Math.round(parseFloat(resellerPriceDollars) * 100)
        : Math.round(price * 0.25)   // default 25% wholesale

      const fd = new FormData()
      fd.append('name', name)
      fd.append('tagline', tagline)
      fd.append('product_type', productType)
      fd.append('image_url', imageUrl)
      fd.append('price_lifetime', String(price))
      fd.append('reseller_price_lifetime', String(wholesale))
      fd.append('description', description)
      fd.append('features', featuresText)

      const res = await createProductSimple(fd)
      if (!res.ok) { setError(res.error ?? 'Failed.'); return }
      router.push('/admin/products')
      router.refresh()
    })
  }

  return (
    <div className="max-w-[820px]">
      {/* Step indicator */}
      <div className="mb-8">
        <ol className="flex items-center gap-1.5 mb-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = step > s.n
            const active = step === s.n
            return (
              <li key={s.n} className="flex items-center gap-1.5 flex-1">
                <button
                  onClick={() => s.n < step && setStep(s.n)}
                  disabled={s.n > step}
                  className="flex items-center gap-2 group"
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors shrink-0"
                    style={{
                      background: done ? 'var(--ok)' : active ? 'var(--brand)' : 'var(--surface-2)',
                      color: done || active ? '#0a0d14' : 'var(--fg-mute)',
                      border: active ? '1px solid var(--brand)' : '1px solid var(--hairline)',
                      boxShadow: active ? '0 0 0 3px rgba(240,164,183,0.20)' : undefined,
                    }}
                  >
                    {done ? <Check size={12} strokeWidth={3} /> : <Icon size={12} />}
                  </span>
                  <span className={`text-[12.5px] font-medium hidden sm:inline ${active ? 'text-[var(--fg)]' : 'text-[var(--fg-mute)]'}`}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className="flex-1 h-px" style={{ background: done ? 'var(--ok)' : 'var(--hairline)' }} />
                )}
              </li>
            )
          })}
        </ol>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
          <div className="h-full transition-all duration-300" style={{
            width: `${(step / STEPS.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--ok), var(--brand))',
          }} />
        </div>
      </div>

      {/* Step body */}
      <div className="card p-7 min-h-[420px]">
        {step === 1 && <StepBasics name={name} setName={setName} tagline={tagline} setTagline={setTagline} productType={productType} setProductType={setProductType} />}
        {step === 2 && <StepImage imageUrl={imageUrl} setImageUrl={setImageUrl} />}
        {step === 3 && <StepPricing priceDollars={priceDollars} setPriceDollars={setPriceDollars} resellerPriceDollars={resellerPriceDollars} setResellerPriceDollars={setResellerPriceDollars} />}
        {step === 4 && <StepDetails description={description} setDescription={setDescription} featuresText={featuresText} setFeaturesText={setFeaturesText} />}
        {step === 5 && (
          <StepReview
            name={name}
            tagline={tagline}
            productType={productType}
            imageUrl={imageUrl}
            priceDollars={priceDollars}
            resellerPriceDollars={resellerPriceDollars}
            description={description}
            featuresText={featuresText}
            onJump={setStep}
          />
        )}
      </div>

      {error && (
        <div className="rounded-md px-4 py-3 mt-4 text-[12.5px] text-[var(--bad)]"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
          {error}
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between mt-5">
        <div>
          {step > 1 && (
            <button onClick={back} disabled={pending} className="btn btn-secondary btn-sm">
              <ChevronLeft size={13} /> Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products" className="text-[12px] text-[var(--fg-mute)] hover:text-[var(--fg-dim)]">
            Cancel
          </Link>
          {step < STEPS.length ? (
            <button onClick={next} disabled={pending} className="btn btn-primary">
              Next <ChevronRight size={13} />
            </button>
          ) : (
            <button onClick={publish} disabled={pending} className="btn btn-primary">
              {pending ? <><Loader2 size={13} className="animate-spin" /> Publishing…</> : <><Check size={13} /> Publish product</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── STEP COMPONENTS ──────────────────────────────────────────── */
function StepBasics({ name, setName, tagline, setTagline, productType, setProductType }: {
  name: string; setName: (v: string) => void;
  tagline: string; setTagline: (v: string) => void;
  productType: string; setProductType: (v: string) => void;
}) {
  return (
    <div>
      <p className="label-mono mb-2">Step 1 of 5</p>
      <h2 className="text-[22px] font-bold tracking-tight mb-2">What are you selling?</h2>
      <p className="text-[13px] text-[var(--fg-dim)] mb-6">Start with the basics. You can edit everything later.</p>

      <div className="space-y-4">
        <div>
          <label className="form-label">Product name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value.slice(0, 80))}
            placeholder="e.g. Perm Spoofer"
            className="form-input text-[16px]"
            autoFocus
          />
          <p className="text-[10.5px] text-[var(--fg-mute)] mt-1">Shown on cards and the product page.</p>
        </div>

        <div>
          <label className="form-label">Tagline <span className="text-[var(--fg-mute)] normal-case text-[10px]">(optional)</span></label>
          <input
            value={tagline}
            onChange={e => setTagline(e.target.value.slice(0, 200))}
            placeholder="One-line description of what it does."
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label mb-2">Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setProductType(t.value)}
                type="button"
                className="px-4 py-3 rounded-md border text-left transition-colors"
                style={{
                  background:  productType === t.value ? 'var(--brand-faint)' : 'var(--surface-2)',
                  borderColor: productType === t.value ? 'rgba(240,164,183,0.40)' : 'var(--hairline)',
                }}
              >
                <p className="font-semibold text-[13px]" style={{ color: productType === t.value ? 'var(--brand)' : 'var(--fg)' }}>
                  {t.label}
                </p>
                <p className="text-[11px] text-[var(--fg-mute)] mt-0.5">{t.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepImage({ imageUrl, setImageUrl }: { imageUrl: string; setImageUrl: (v: string) => void }) {
  return (
    <div>
      <p className="label-mono mb-2">Step 2 of 5</p>
      <h2 className="text-[22px] font-bold tracking-tight mb-2">Pick or generate an image</h2>
      <p className="text-[13px] text-[var(--fg-dim)] mb-6">
        16:9 banner shown on cards + the product page. Upload your own, pick from your library, or generate a Cosmocheats-style banner.
      </p>
      <ImagePicker value={imageUrl} onChange={setImageUrl} />
      {!imageUrl && (
        <p className="text-[11px] text-[var(--fg-mute)] mt-3">
          No image? That&apos;s fine — we&apos;ll use a gradient placeholder. You can add one later.
        </p>
      )}
    </div>
  )
}

function StepPricing({ priceDollars, setPriceDollars, resellerPriceDollars, setResellerPriceDollars }: {
  priceDollars: string; setPriceDollars: (v: string) => void;
  resellerPriceDollars: string; setResellerPriceDollars: (v: string) => void;
}) {
  const dollarsNum = parseFloat(priceDollars) || 0
  const defaultWholesale = dollarsNum * 0.25
  const customWholesale = parseFloat(resellerPriceDollars) || 0
  const actualWholesale = customWholesale > 0 ? customWholesale : defaultWholesale

  return (
    <div>
      <p className="label-mono mb-2">Step 3 of 5</p>
      <h2 className="text-[22px] font-bold tracking-tight mb-2">Pricing</h2>
      <p className="text-[13px] text-[var(--fg-dim)] mb-6">
        Just the lifetime price for now. You can add 1-day / weekly / monthly tiers later from the edit page.
      </p>

      <div className="space-y-5">
        <div>
          <label className="form-label">Customer lifetime price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--fg-mute)]">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceDollars}
              onChange={e => setPriceDollars(e.target.value)}
              placeholder="50.00"
              className="form-input pl-7 text-[20px] tabular-nums font-bold"
            />
          </div>
          <p className="text-[11px] text-[var(--fg-mute)] mt-1">What individual customers pay.</p>
        </div>

        <div>
          <label className="form-label">
            Reseller wholesale (per key)
            <span className="text-[var(--fg-mute)] normal-case text-[10px] ml-2">optional — defaults to 25% of customer price</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--fg-mute)]">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={resellerPriceDollars}
              onChange={e => setResellerPriceDollars(e.target.value)}
              placeholder={defaultWholesale.toFixed(2)}
              className="form-input pl-7 tabular-nums"
            />
          </div>
        </div>

        {/* Live math preview */}
        <div className="rounded-md p-4 grid grid-cols-2 gap-3"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
          <div>
            <p className="text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider">Customer pays</p>
            <p className="text-[20px] font-bold tabular-nums">${dollarsNum.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider">Reseller pays</p>
            <p className="text-[20px] font-bold tabular-nums text-[var(--brand)]">${actualWholesale.toFixed(2)}</p>
          </div>
          {dollarsNum > 0 && (
            <div className="col-span-2 pt-3 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <p className="text-[11px] text-[var(--fg-dim)]">
                Resellers earn <strong className="text-[var(--ok)]">${(dollarsNum - actualWholesale).toFixed(2)}</strong> per key (
                {((1 - actualWholesale / dollarsNum) * 100).toFixed(0)}% margin)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StepDetails({ description, setDescription, featuresText, setFeaturesText }: {
  description: string; setDescription: (v: string) => void;
  featuresText: string; setFeaturesText: (v: string) => void;
}) {
  return (
    <div>
      <p className="label-mono mb-2">Step 4 of 5</p>
      <h2 className="text-[22px] font-bold tracking-tight mb-2">Description &amp; features</h2>
      <p className="text-[13px] text-[var(--fg-dim)] mb-6">Both optional but help conversion.</p>

      <div className="space-y-4">
        <div>
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="What does this tool do? Why is it good?"
            className="form-input resize-none font-[inherit]"
          />
        </div>

        <div>
          <label className="form-label">Features (one per line)</label>
          <textarea
            value={featuresText}
            onChange={e => setFeaturesText(e.target.value)}
            rows={5}
            placeholder={'HWID protection\nAuto-updater\nDiscord notifications\nLifetime support'}
            className="form-input resize-none font-[inherit]"
          />
          <p className="text-[10.5px] text-[var(--fg-mute)] mt-1">Shown as a check-list on the product page.</p>
        </div>
      </div>
    </div>
  )
}

function StepReview({ name, tagline, productType, imageUrl, priceDollars, resellerPriceDollars, description, featuresText, onJump }: {
  name: string; tagline: string; productType: string; imageUrl: string;
  priceDollars: string; resellerPriceDollars: string;
  description: string; featuresText: string;
  onJump: (step: number) => void;
}) {
  const features = featuresText.split('\n').map(s => s.trim()).filter(Boolean)
  const dollarsNum = parseFloat(priceDollars) || 0
  const wholesale = parseFloat(resellerPriceDollars) || (dollarsNum * 0.25)

  return (
    <div>
      <p className="label-mono mb-2">Step 5 of 5 · Review</p>
      <h2 className="text-[22px] font-bold tracking-tight mb-6">Looks good?</h2>

      <div className="space-y-3">
        <ReviewRow label="Name" value={name || '—'} onEdit={() => onJump(1)} />
        <ReviewRow label="Tagline" value={tagline || '(none)'} onEdit={() => onJump(1)} />
        <ReviewRow label="Type" value={productType} onEdit={() => onJump(1)} />
        <ReviewRow label="Image" value={imageUrl ? '✓ Set' : '(none — gradient placeholder)'} onEdit={() => onJump(2)} />
        <ReviewRow label="Customer price" value={`$${dollarsNum.toFixed(2)}`} onEdit={() => onJump(3)} />
        <ReviewRow label="Reseller wholesale" value={`$${wholesale.toFixed(2)}`} onEdit={() => onJump(3)} />
        <ReviewRow label="Features" value={features.length > 0 ? `${features.length} listed` : '(none)'} onEdit={() => onJump(4)} />
      </div>

      <div className="card p-4 mt-5" style={{ background: 'var(--brand-faint)', border: '1px solid rgba(240,164,183,0.30)' }}>
        <p className="text-[12.5px] text-[var(--fg-dim)]">
          After publishing, you can come back any time to add daily/weekly/monthly pricing,
          gallery images, badges, SEO meta, and more from the product&apos;s edit page.
        </p>
      </div>
    </div>
  )
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-md"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider">{label}</p>
        <p className="text-[13px] font-semibold truncate">{value}</p>
      </div>
      <button onClick={onEdit} className="text-[11.5px] text-[var(--brand)] hover:underline shrink-0">
        Edit
      </button>
    </div>
  )
}
