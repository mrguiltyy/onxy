'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CreditCard, Loader2, Check, AlertTriangle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const PRESETS = [1000, 2500, 5000, 10000, 25000]   // cents

export function StripeTopupCard() {
  const sp = useSearchParams()
  const [amount, setAmount] = useState(2500)
  const [custom, setCustom] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ kind: 'ok' | 'cancel'; text: string } | null>(null)

  // Detect post-checkout return
  useEffect(() => {
    const topup = sp.get('topup')
    if (topup === 'success') {
      setFlash({ kind: 'ok',     text: 'Payment received! Wallet credited.' })
      setTimeout(() => setFlash(null), 5000)
    } else if (topup === 'cancel') {
      setFlash({ kind: 'cancel', text: 'Top-up canceled. No charge made.' })
      setTimeout(() => setFlash(null), 4000)
    }
  }, [sp])

  async function startCheckout() {
    setError(null)
    setPending(true)
    try {
      const cents = custom ? Math.round(parseFloat(custom) * 100) : amount
      if (!Number.isFinite(cents) || cents < 500) {
        setError('Minimum top-up is $5.00.'); setPending(false); return
      }
      const res = await fetch('/api/stripe/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cents }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to start checkout.'); setPending(false); return
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setPending(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <p className="label-mono">Top up with card</p>
        <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-auto"
          style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
          Stripe
        </span>
      </div>

      {flash && (
        <div className="rounded-md px-3 py-2 text-[12.5px] flex items-start gap-2 mb-3" style={{
          background: flash.kind === 'ok' ? 'rgba(34,197,94,0.08)' : 'rgba(250,204,21,0.08)',
          border: `1px solid ${flash.kind === 'ok' ? 'rgba(34,197,94,0.25)' : 'rgba(250,204,21,0.25)'}`,
          color: flash.kind === 'ok' ? 'var(--ok)' : 'var(--warn)',
        }}>
          {flash.kind === 'ok' ? <Check size={13} className="mt-0.5 shrink-0" /> : <AlertTriangle size={13} className="mt-0.5 shrink-0" />}
          {flash.text}
        </div>
      )}

      <p className="text-[11.5px] text-[var(--fg-dim)] mb-3">
        Add funds instantly. Min $5 · Max $5,000 / transaction.
      </p>

      {/* Preset amounts */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {PRESETS.map(p => (
          <button
            key={p}
            onClick={() => { setAmount(p); setCustom('') }}
            disabled={pending}
            className="px-2 py-2 rounded-md border text-[12.5px] font-bold tabular-nums transition-colors"
            style={{
              background:  !custom && amount === p ? 'var(--brand-faint)' : 'var(--surface-2)',
              color:       !custom && amount === p ? 'var(--brand)' : 'var(--fg-dim)',
              borderColor: !custom && amount === p ? 'rgba(59,130,246,0.30)' : 'var(--hairline)',
            }}
          >
            ${p / 100}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <label className="form-label">Or custom amount ($)</label>
      <input
        type="number"
        min="5"
        max="5000"
        step="0.01"
        value={custom}
        onChange={e => { setCustom(e.target.value); setAmount(0) }}
        placeholder="50.00"
        className="form-input tabular-nums mb-3"
        disabled={pending}
      />

      {error && (
        <div className="text-[12px] text-[var(--bad)] mb-3">{error}</div>
      )}

      <button onClick={startCheckout} disabled={pending} className="btn btn-primary w-full">
        {pending ? <><Loader2 size={13} className="animate-spin" /> Redirecting…</> : <><CreditCard size={13} /> Pay {formatPrice(custom ? Math.round(parseFloat(custom || '0') * 100) : amount)} with card</>}
      </button>
      <p className="text-[10px] text-[var(--fg-mute)] text-center mt-2">Secure checkout via Stripe · Visa / Mastercard / Amex</p>
    </div>
  )
}
