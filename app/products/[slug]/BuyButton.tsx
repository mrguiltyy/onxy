'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Props {
  productId:  string
  signedIn:   boolean
  prices: {
    day?:      number | null
    week?:     number | null
    month?:    number | null
    lifetime?: number | null
  }
  ctaLabel?: string | null
  ctaColor?: string | null
}

type Tier = 'day' | 'week' | 'month' | 'lifetime'

export function BuyButton({ productId, signedIn, prices, ctaLabel, ctaColor }: Props) {
  const router = useRouter()
  const available: { tier: Tier; label: string; cents: number }[] = []
  if (prices.lifetime != null) available.push({ tier: 'lifetime', label: 'Lifetime', cents: prices.lifetime })
  if (prices.month    != null) available.push({ tier: 'month',    label: '1 month', cents: prices.month })
  if (prices.week     != null) available.push({ tier: 'week',     label: '1 week',  cents: prices.week })
  if (prices.day      != null) available.push({ tier: 'day',      label: '1 day',   cents: prices.day })

  const [tier, setTier] = useState<Tier>(available[0]?.tier ?? 'lifetime')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (available.length === 0) {
    return <p className="text-[12px] text-[var(--fg-mute)]">No pricing tiers configured yet.</p>
  }

  async function buy() {
    if (!signedIn) {
      router.push(`/login?next=/products/${productId}`)
      return
    }
    setError(null)
    setPending(true)
    try {
      const res = await fetch('/api/stripe/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, tier }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not start checkout.')
        setPending(false)
        return
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setPending(false)
    }
  }

  const selectedPrice = available.find(a => a.tier === tier)?.cents ?? 0
  const buttonStyle = ctaColor ? { background: ctaColor, color: '#0a0d14' } : undefined

  return (
    <div>
      {/* Tier selector */}
      {available.length > 1 && (
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {available.map(a => (
            <button
              key={a.tier}
              onClick={() => setTier(a.tier)}
              className="px-3 py-2 rounded-md border text-left transition-colors"
              style={{
                background:  tier === a.tier ? 'var(--brand-faint)' : 'var(--surface-2)',
                borderColor: tier === a.tier ? 'rgba(59,130,246,0.30)' : 'var(--hairline)',
              }}
            >
              <p className="text-[10.5px] uppercase tracking-wider font-mono"
                 style={{ color: tier === a.tier ? 'var(--brand)' : 'var(--fg-mute)' }}>
                {a.label}
              </p>
              <p className="font-bold tabular-nums text-[14px]" style={{ color: tier === a.tier ? 'var(--brand)' : 'var(--fg)' }}>
                {formatPrice(a.cents)}
              </p>
            </button>
          ))}
        </div>
      )}

      <button onClick={buy} disabled={pending} className={`btn w-full ${ctaColor ? '' : 'btn-primary'}`} style={buttonStyle}>
        {pending ? (
          <><Loader2 size={13} className="animate-spin" /> Redirecting…</>
        ) : (
          <>{ctaLabel ?? 'Buy now'} — {formatPrice(selectedPrice)} <ArrowRight size={13} /></>
        )}
      </button>
      {error && <p className="text-[11.5px] text-[var(--bad)] mt-2">{error}</p>}
      <p className="text-[10.5px] text-[var(--fg-mute)] text-center mt-2">Secure card payment · Instant delivery</p>
    </div>
  )
}
