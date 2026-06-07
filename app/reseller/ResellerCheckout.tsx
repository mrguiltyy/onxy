'use client'
import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowRight, Loader2, Wallet, Calendar, Infinity as InfinityIcon, AlertTriangle, Boxes } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { purchaseResellerV2 } from './actions-v2'

interface Product {
  id:        string
  slug:      string
  name:      string
  tagline:   string | null
  image_url: string | null
}

interface Config {
  base_price_cents:     number
  per_tool_extra_cents: number
  tools_included_base:  number
  yearly_discount_pct:  number
  lifetime_multiplier:  number
}

interface Props {
  products:     Product[]
  config:       Config
  signedIn:     boolean
  balanceCents: number
  isReseller:   boolean
}

type Cycle = 'monthly' | 'yearly' | 'lifetime'

export function ResellerCheckout({ products, config, signedIn, balanceCents, isReseller }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const baseMonthly = config.base_price_cents
  const perExtra    = config.per_tool_extra_cents
  const included    = config.tools_included_base

  const monthlyTotal = useMemo(() => {
    const count = selected.size
    if (count === 0) return 0
    const extras = Math.max(0, count - included)
    return baseMonthly + extras * perExtra
  }, [selected, baseMonthly, perExtra, included])

  const cycleTotal = useMemo(() => {
    if (monthlyTotal === 0) return 0
    if (cycle === 'monthly')  return monthlyTotal
    if (cycle === 'yearly')   return Math.round(monthlyTotal * 12 * (100 - config.yearly_discount_pct) / 100)
    return Math.round(monthlyTotal * config.lifetime_multiplier)
  }, [cycle, monthlyTotal, config])

  const yearlyTotalIfChosen   = Math.round(monthlyTotal * 12 * (100 - config.yearly_discount_pct) / 100)
  const lifetimeTotalIfChosen = Math.round(monthlyTotal * config.lifetime_multiplier)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function checkout() {
    setError(null)
    if (!signedIn) {
      router.push(`/login?next=/reseller`)
      return
    }
    if (selected.size === 0) {
      setError('Pick at least one tool to resell.')
      return
    }
    if (cycleTotal > balanceCents) {
      setError(`Insufficient wallet balance. You need ${formatPrice(cycleTotal - balanceCents)} more.`)
      return
    }
    start(async () => {
      const res = await purchaseResellerV2(Array.from(selected), cycle, cycleTotal)
      if (!res.ok) { setError(res.error ?? 'Purchase failed.'); return }
      setDone(true)
      setTimeout(() => router.push('/dashboard/resells'), 1500)
    })
  }

  if (done) {
    return (
      <div className="card max-w-[640px] mx-auto p-10 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'var(--ok)', color: '#0a0d14' }}>
          <Check size={26} strokeWidth={2.5} />
        </div>
        <h2 className="text-[24px] font-bold tracking-tight mb-2">Welcome, reseller</h2>
        <p className="text-[13.5px] text-[var(--fg-dim)]">Redirecting you to your panel…</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="card max-w-[640px] mx-auto p-12 text-center">
        <Boxes size={32} className="mx-auto mb-3 text-[var(--fg-faint)]" />
        <p className="text-[14px] text-[var(--fg-dim)] mb-1">No tools available to resell right now.</p>
        <p className="text-[12.5px] text-[var(--fg-mute)]">Check back soon — we&apos;re adding more.</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

      {/* Left — tool grid */}
      <div>
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <p className="label-mono">Step 1 · Pick your tools</p>
          <span className="text-[12px] text-[var(--fg-dim)]">
            <strong className="text-[var(--brand)] tabular-nums">{selected.size}</strong> selected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map(p => {
            const isSelected = selected.has(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                type="button"
                className="card p-0 text-left transition-all overflow-hidden relative"
                style={{
                  borderColor: isSelected ? 'var(--brand)' : 'var(--hairline)',
                  background: isSelected ? 'var(--brand-faint)' : 'var(--surface)',
                  boxShadow: isSelected ? '0 0 0 1px var(--brand), 0 12px 28px rgba(240,164,183,0.15)' : undefined,
                }}
              >
                {/* Image */}
                <div
                  className="h-24 relative"
                  style={{
                    background: p.image_url
                      ? `url(${p.image_url}) center/cover`
                      : 'linear-gradient(135deg, rgba(240,164,183,0.20), rgba(162,200,238,0.20))',
                    borderBottom: '1px solid var(--hairline)',
                  }}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--brand)', color: '#0a0d14' }}>
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="font-semibold text-[13.5px] truncate">{p.name}</p>
                  {p.tagline && <p className="text-[11.5px] text-[var(--fg-dim)] line-clamp-2 mt-0.5">{p.tagline}</p>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right — sticky checkout panel */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <p className="label-mono mb-4">Step 2 · Pick billing</p>

          <div className="space-y-2 mb-5">
            <CycleOption
              cycle="monthly"
              active={cycle === 'monthly'}
              onClick={() => setCycle('monthly')}
              label="Monthly"
              price={monthlyTotal}
              suffix="/mo"
              icon={<Calendar size={12} />}
            />
            <CycleOption
              cycle="yearly"
              active={cycle === 'yearly'}
              onClick={() => setCycle('yearly')}
              label="Yearly"
              price={yearlyTotalIfChosen}
              suffix="/yr"
              icon={<Calendar size={12} />}
              note={monthlyTotal > 0 ? `save ${config.yearly_discount_pct}%` : null}
            />
            <CycleOption
              cycle="lifetime"
              active={cycle === 'lifetime'}
              onClick={() => setCycle('lifetime')}
              label="Lifetime"
              price={lifetimeTotalIfChosen}
              suffix=" once"
              icon={<InfinityIcon size={12} />}
              note="pay once"
            />
          </div>

          {/* Itemized */}
          <div className="border-t pt-4 space-y-1.5 mb-3 text-[12px]" style={{ borderColor: 'var(--hairline)' }}>
            <Row label={`${selected.size === 0 ? 0 : 1} included tool`} value={selected.size > 0 ? formatPrice(baseMonthly) : '—'} />
            <Row label={`${Math.max(0, selected.size - included)} extra tool${selected.size - included === 1 ? '' : 's'}`}
              value={selected.size > included ? formatPrice((selected.size - included) * perExtra) : '—'} />
            <Row label={`Subtotal /mo`} value={selected.size > 0 ? formatPrice(monthlyTotal) : formatPrice(0)} mute />
          </div>

          <div className="border-t pt-3 flex items-center justify-between font-bold mb-4" style={{ borderColor: 'var(--hairline)' }}>
            <span className="text-[14px]">Total</span>
            <span className="text-[18px] tabular-nums">{formatPrice(cycleTotal)}</span>
          </div>

          {/* Wallet */}
          {signedIn && (
            <div className="rounded-md p-3 mb-4 flex items-center gap-2.5"
              style={{ background: cycleTotal > balanceCents ? 'rgba(250,204,21,0.06)' : 'var(--brand-faint)',
                       border: `1px solid ${cycleTotal > balanceCents ? 'rgba(250,204,21,0.25)' : 'rgba(59,130,246,0.30)'}` }}>
              <Wallet size={13} className={cycleTotal > balanceCents ? 'text-[var(--warn)]' : 'text-[var(--brand)]'} />
              <div className="flex-1 text-[11.5px]">
                <p className="font-semibold">Wallet · {formatPrice(balanceCents)}</p>
                {cycleTotal > balanceCents && (
                  <p className="text-[var(--warn)]">Need {formatPrice(cycleTotal - balanceCents)} more</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="text-[12px] text-[var(--bad)] mb-3 flex items-start gap-1.5">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {isReseller ? (
            <Link href="/dashboard/resells" className="btn btn-secondary w-full">
              You&apos;re already a reseller →
            </Link>
          ) : !signedIn ? (
            <Link href="/register?next=/reseller" className="btn btn-primary w-full">
              Sign up to continue <ArrowRight size={13} />
            </Link>
          ) : cycleTotal > balanceCents ? (
            <Link href="/dashboard/balance" className="btn btn-primary w-full">
              Top up wallet <Wallet size={13} />
            </Link>
          ) : (
            <button onClick={checkout} disabled={pending || selected.size === 0} className="btn btn-primary w-full">
              {pending ? <><Loader2 size={13} className="animate-spin" /> Activating…</> :
                <>Activate reseller · {formatPrice(cycleTotal)}</>}
            </button>
          )}
          <p className="text-[10px] text-[var(--fg-mute)] text-center mt-3">
            Wallet payments instant · Stripe + crypto coming soon
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mute }: { label: string; value: string; mute?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={mute ? 'text-[var(--fg-mute)]' : 'text-[var(--fg-dim)]'}>{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  )
}

function CycleOption({ active, onClick, label, price, suffix, icon, note }: {
  cycle:   Cycle
  active:  boolean
  onClick: () => void
  label:   string
  price:   number
  suffix:  string
  icon:    React.ReactNode
  note?:   string | null
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2.5 rounded-md border text-left transition-colors w-full flex items-center justify-between"
      style={{
        background:  active ? 'var(--brand-faint)' : 'var(--surface-2)',
        borderColor: active ? 'rgba(59,130,246,0.30)' : 'var(--hairline)',
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: active ? 'var(--brand)' : 'var(--fg-mute)' }}>{icon}</span>
        <span className="text-[12.5px] font-semibold" style={{ color: active ? 'var(--brand)' : 'var(--fg)' }}>{label}</span>
        {note && <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(34,197,94,0.10)', color: 'var(--ok)' }}>{note}</span>}
      </div>
      <span className="font-bold tabular-nums text-[13px]">
        {formatPrice(price)}
        <span className="text-[10.5px] text-[var(--fg-mute)] font-medium ml-0.5">{suffix}</span>
      </span>
    </button>
  )
}
