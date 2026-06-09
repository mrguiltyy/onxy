'use client'
import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Calendar, Infinity as InfinityIcon, Loader2, Check, Wallet } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { purchaseSubscription } from './subscription-actions'

interface Props {
  productId:    string
  productName:  string
  productType:  string                // 'subscription' shows different copy
  signedIn:     boolean
  walletCents:  number
  prices: {
    day?:      number | null
    week?:     number | null
    month?:    number | null
    lifetime?: number | null
  }
  hasActiveSub: boolean
  currentExpiresAt: string | null
}

type Tier = '1d' | '7d' | '30d' | 'lifetime'

interface TierOption {
  key:   Tier
  label: string
  cents: number
  icon:  React.ReactNode
}

export function SubscribeButton({ productId, productName, productType, signedIn, walletCents, prices, hasActiveSub, currentExpiresAt }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone]   = useState<{ expiresAt: string | null; extended: boolean } | null>(null)

  const available = useMemo<TierOption[]>(() => {
    const arr: TierOption[] = []
    if (prices.day      != null) arr.push({ key: '1d',       label: '1 day',   cents: prices.day,      icon: <Calendar size={11} /> })
    if (prices.week     != null) arr.push({ key: '7d',       label: '1 week',  cents: prices.week,     icon: <Calendar size={11} /> })
    if (prices.month    != null) arr.push({ key: '30d',      label: '1 month', cents: prices.month,    icon: <Calendar size={11} /> })
    if (prices.lifetime != null) arr.push({ key: 'lifetime', label: 'Lifetime', cents: prices.lifetime, icon: <InfinityIcon size={11} /> })
    return arr
  }, [prices])

  const defaultTier = available.find(a => a.key === '30d') ?? available[available.length - 1]
  const [tier, setTier] = useState<Tier>(defaultTier?.key ?? 'lifetime')

  const selected = available.find(a => a.key === tier)
  const cost = selected?.cents ?? 0
  const canPay = walletCents >= cost
  const shortfall = Math.max(0, cost - walletCents)

  function pay() {
    setError(null)
    if (!signedIn) {
      router.push(`/login?next=/products/${productId}`)
      return
    }
    if (!selected) return
    start(async () => {
      const res = await purchaseSubscription(productId, tier, cost)
      if (!res.ok) {
        setError(res.error ?? 'Purchase failed.')
        return
      }
      setDone({ expiresAt: res.expiresAt ?? null, extended: !!res.extended })
      setTimeout(() => router.push('/dashboard/subscriptions'), 2000)
    })
  }

  if (available.length === 0) {
    return <p className="text-[12px] text-[var(--fg-mute)] text-center">No pricing set yet.</p>
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
          style={{ background: 'var(--ok)', color: '#0a0d14' }}>
          <Check size={20} strokeWidth={3} />
        </div>
        <p className="font-semibold text-[14px] mb-1">
          {done.extended ? 'Extended!' : 'You\'re in!'}
        </p>
        <p className="text-[12px] text-[var(--fg-dim)] mb-2">
          {done.expiresAt
            ? `Access until ${new Date(done.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : 'Lifetime access activated.'}
        </p>
        <p className="text-[11px] text-[var(--fg-mute)]">Redirecting to your subscriptions…</p>
      </div>
    )
  }

  const isSubscription = productType === 'subscription'

  return (
    <div>
      {/* Active sub banner */}
      {hasActiveSub && currentExpiresAt && (
        <div className="rounded-md p-3 mb-3 flex items-start gap-2 text-[11.5px]"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <Check size={11} className="text-[var(--ok)] mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-[var(--ok)]">Active until {new Date(currentExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p className="text-[var(--fg-dim)] mt-0.5">Buying more time extends your current access.</p>
          </div>
        </div>
      )}

      {/* Tier picker */}
      <div className="space-y-1.5 mb-3">
        {available.map(a => (
          <button
            key={a.key}
            onClick={() => setTier(a.key)}
            type="button"
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border transition-colors"
            style={{
              background:  tier === a.key ? 'var(--brand-faint)' : 'var(--surface-2)',
              borderColor: tier === a.key ? 'rgba(240,164,183,0.40)' : 'var(--hairline)',
            }}
          >
            <span className="flex items-center gap-2 text-[12.5px]" style={{ color: tier === a.key ? 'var(--brand)' : 'var(--fg-dim)' }}>
              {a.icon} {a.label}
            </span>
            <span className="font-bold tabular-nums text-[13.5px]">{formatPrice(a.cents)}</span>
          </button>
        ))}
      </div>

      {/* Wallet */}
      {signedIn && (
        <div className="rounded-md p-2.5 mb-3 flex items-center gap-2"
          style={{
            background: canPay ? 'var(--brand-faint)' : 'rgba(250,204,21,0.06)',
            border: `1px solid ${canPay ? 'rgba(240,164,183,0.30)' : 'rgba(250,204,21,0.25)'}`,
          }}>
          <Wallet size={11} className={canPay ? 'text-[var(--brand)]' : 'text-[var(--warn)]'} />
          <span className="text-[11px] text-[var(--fg-dim)] flex-1">
            Wallet: <strong className="text-[var(--fg)]">{formatPrice(walletCents)}</strong>
            {!canPay && <span className="text-[var(--warn)]"> · need {formatPrice(shortfall)} more</span>}
          </span>
        </div>
      )}

      {/* Action */}
      {!signedIn ? (
        <button onClick={pay} className="btn btn-primary w-full">
          Sign in to {isSubscription ? 'subscribe' : 'buy'} <ArrowRight size={13} />
        </button>
      ) : !canPay ? (
        <a href="/dashboard/balance" className="btn btn-primary w-full">
          Top up wallet <Wallet size={13} />
        </a>
      ) : (
        <button onClick={pay} disabled={pending} className="btn btn-primary w-full">
          {pending
            ? <><Loader2 size={13} className="animate-spin" /> Activating…</>
            : <>{hasActiveSub ? 'Extend' : isSubscription ? 'Subscribe' : 'Buy'} for {formatPrice(cost)}</>}
        </button>
      )}

      {error && (
        <p className="text-[11.5px] text-[var(--bad)] mt-2 text-center">{error}</p>
      )}

      <p className="text-[10px] text-[var(--fg-mute)] text-center mt-2">
        Wallet payment · instant access · {isSubscription ? 'cancel anytime' : 'permanent license'}
      </p>
    </div>
  )
}
