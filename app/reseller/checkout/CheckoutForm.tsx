'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Infinity, Wallet, Loader2, Check, AlertTriangle, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { purchaseResellerPlan } from './actions'

interface Plan {
  id:                   string
  slug:                 string
  name:                 string
  price_lifetime_cents: number | null
  price_monthly_cents:  number | null
  price_yearly_cents:   number | null
}

type Cycle = 'lifetime' | 'yearly' | 'monthly'

export function CheckoutForm({ plan, balance, userId }: { plan: Plan; balance: number; userId: string }) {
  // Default to cheapest option
  const initialCycle: Cycle = plan.price_monthly_cents != null ? 'monthly'
    : plan.price_yearly_cents != null ? 'yearly' : 'lifetime'

  const [cycle, setCycle] = useState<Cycle>(initialCycle)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const cents =
    cycle === 'lifetime' ? plan.price_lifetime_cents
    : cycle === 'monthly' ? plan.price_monthly_cents
    : plan.price_yearly_cents

  const canPay = cents !== null && cents !== undefined && balance >= (cents ?? 0)
  const shortfall = cents !== null && cents !== undefined ? Math.max(0, cents - balance) : 0

  function pay() {
    setError(null)
    if (!cents) return
    start(async () => {
      const res = await purchaseResellerPlan(plan.id, cycle, cents)
      if (!res.ok) { setError(res.error ?? 'Failed.'); return }
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.10)' }}>
          <Check size={28} className="text-[var(--ok)]" />
        </div>
        <h2 className="text-[22px] font-bold tracking-tight mb-2">You&apos;re a reseller</h2>
        <p className="text-[13.5px] text-[var(--fg-dim)] mb-6">
          Your account just upgraded. Apply to resell any product or set up your first application now.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/products" className="btn btn-primary">
            Browse to resell <ArrowRight size={13} />
          </Link>
          <Link href="/dashboard/applications" className="btn btn-secondary">
            My applications
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-7">
        <p className="label-mono mb-3">Choose billing</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {plan.price_monthly_cents != null && (
            <CycleOption
              cycle="monthly"
              active={cycle === 'monthly'}
              onClick={() => setCycle('monthly')}
              label="Monthly"
              price={plan.price_monthly_cents}
              suffix="/mo"
              icon={<Calendar size={13} />}
            />
          )}
          {plan.price_yearly_cents != null && (
            <CycleOption
              cycle="yearly"
              active={cycle === 'yearly'}
              onClick={() => setCycle('yearly')}
              label="Yearly"
              price={plan.price_yearly_cents}
              suffix="/yr"
              icon={<Calendar size={13} />}
              note={plan.price_monthly_cents ? 'save ~17%' : null}
            />
          )}
          {plan.price_lifetime_cents != null && (
            <CycleOption
              cycle="lifetime"
              active={cycle === 'lifetime'}
              onClick={() => setCycle('lifetime')}
              label="Lifetime"
              price={plan.price_lifetime_cents}
              suffix="once"
              icon={<Infinity size={13} />}
              note="best value"
            />
          )}
        </div>
      </div>

      {/* Payment method */}
      <div className="mb-7">
        <p className="label-mono mb-3">Payment method</p>
        <div
          className="rounded-md p-4 flex items-center gap-3 cursor-default"
          style={{ background: 'var(--brand-faint)', border: '1px solid rgba(59,130,246,0.30)' }}
        >
          <span className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--brand)', color: '#0a0d14' }}>
            <Wallet size={14} />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-[13.5px]">Wallet balance</p>
            <p className="text-[12px] text-[var(--fg-dim)]">
              {formatPrice(balance)} available {!canPay && cents != null && <span className="text-[var(--bad)]">· need {formatPrice(shortfall)} more</span>}
            </p>
          </div>
          {canPay && <Check size={14} className="text-[var(--ok)]" />}
        </div>
      </div>

      {/* Order line */}
      <div className="border-t pt-5" style={{ borderColor: 'var(--hairline)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[14px] text-[var(--fg-dim)]">{plan.name} ({cycle})</span>
          <span className="font-mono tabular-nums text-[14px]">{formatPrice(cents ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between text-[18px] font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(cents ?? 0)}</span>
        </div>
      </div>

      {error && (
        <div className="text-[12.5px] text-[var(--bad)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-md px-3 py-2 mt-4 flex items-start gap-2">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6">
        {canPay ? (
          <button onClick={pay} disabled={pending} className="btn btn-primary w-full">
            {pending ? <><Loader2 size={14} className="animate-spin" /> Activating…</> : <>Pay {formatPrice(cents ?? 0)} from wallet</>}
          </button>
        ) : (
          <Link href="/dashboard/balance" className="btn btn-primary w-full">
            Top up wallet ({formatPrice(shortfall)} more needed) <ArrowRight size={13} />
          </Link>
        )}
        <p className="text-[10.5px] text-[var(--fg-mute)] text-center mt-3">
          Wallet payments are instant. You can also pay externally via Stripe (coming soon).
        </p>
      </div>
    </>
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
      onClick={onClick}
      className="px-4 py-3 rounded-md border text-left transition-colors"
      style={{
        background:  active ? 'var(--brand-faint)' : 'var(--surface-2)',
        borderColor: active ? 'rgba(59,130,246,0.30)' : 'var(--hairline)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: active ? 'var(--brand)' : 'var(--fg-mute)' }}>{icon}</span>
        <span className="text-[12px] font-semibold" style={{ color: active ? 'var(--brand)' : 'var(--fg-dim)' }}>{label}</span>
        {note && <span className="text-[9.5px] font-bold uppercase tracking-wider ml-auto px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(34,197,94,0.10)', color: 'var(--ok)' }}>{note}</span>}
      </div>
      <p className="font-bold tabular-nums text-[15px]">
        {formatPrice(price)}
        <span className="text-[11px] text-[var(--fg-mute)] font-medium ml-0.5">{suffix}</span>
      </p>
    </button>
  )
}
