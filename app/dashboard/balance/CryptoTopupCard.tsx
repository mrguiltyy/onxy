'use client'
import { useState } from 'react'
import { Bitcoin, Loader2, Copy, Check, Clock, ArrowRight, AlertTriangle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const PRESETS = [1000, 2500, 5000, 10000, 25000]

const CRYPTO = [
  { code: 'btc',         label: 'BTC' },
  { code: 'eth',         label: 'ETH' },
  { code: 'usdttrc20',   label: 'USDT (TRC20)' },
  { code: 'usdterc20',   label: 'USDT (ERC20)' },
  { code: 'usdcerc20',   label: 'USDC' },
  { code: 'sol',         label: 'SOL' },
  { code: 'ltc',         label: 'LTC' },
  { code: 'doge',        label: 'DOGE' },
  { code: 'bnbbsc',      label: 'BNB (BSC)' },
  { code: 'trx',         label: 'TRX' },
  { code: 'xmr',         label: 'XMR' },
]

interface CreatedPayment {
  payment_id:   string
  pay_address:  string
  pay_amount:   number
  pay_currency: string
  expiration_estimate_date?: string
}

export function CryptoTopupCard() {
  const [amount, setAmount]   = useState(2500)
  const [custom, setCustom]   = useState('')
  const [currency, setCurrency] = useState('btc')
  const [pending, setPending] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [payment, setPayment] = useState<CreatedPayment | null>(null)
  const [copied, setCopied]   = useState<'addr' | 'amount' | null>(null)

  async function startPayment() {
    setError(null)
    setPending(true)
    try {
      const cents = custom ? Math.round(parseFloat(custom) * 100) : amount
      if (!Number.isFinite(cents) || cents < 500) {
        setError('Minimum is $5.00.'); setPending(false); return
      }
      const res = await fetch('/api/crypto/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cents, pay_currency: currency }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not start payment.'); setPending(false); return
      }
      setPayment(data.payment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
    } finally {
      setPending(false)
    }
  }

  async function copy(value: string, which: 'addr' | 'amount') {
    await navigator.clipboard.writeText(value)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  // ── Show pay address after payment created ──
  if (payment) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bitcoin size={14} className="text-[#f7931a]" />
          <p className="label-mono">Send crypto to pay</p>
        </div>

        <p className="text-[12.5px] text-[var(--fg-dim)] mb-4 leading-relaxed">
          Send exactly the amount below to the address. Funds credit your wallet automatically once confirmed on-chain (usually 5–30 min).
        </p>

        <div className="mb-3">
          <p className="form-label">Pay amount ({payment.pay_currency.toUpperCase()})</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-[14px] px-3 py-2.5 rounded-md tabular-nums"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', color: 'var(--brand)' }}>
              {payment.pay_amount}
            </code>
            <button onClick={() => copy(String(payment.pay_amount), 'amount')} className="btn btn-secondary btn-sm">
              {copied === 'amount' ? <><Check size={12} /> Copied</> : <><Copy size={12} /></>}
            </button>
          </div>
        </div>

        <div className="mb-3">
          <p className="form-label">Send to address</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-[11.5px] px-3 py-2.5 rounded-md break-all"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', color: 'var(--fg)' }}>
              {payment.pay_address}
            </code>
            <button onClick={() => copy(payment.pay_address, 'addr')} className="btn btn-secondary btn-sm shrink-0">
              {copied === 'addr' ? <><Check size={12} /> Copied</> : <><Copy size={12} /></>}
            </button>
          </div>
        </div>

        {payment.expiration_estimate_date && (
          <p className="text-[11.5px] text-[var(--fg-mute)] inline-flex items-center gap-1.5 mb-4">
            <Clock size={11} />
            Address expires {new Date(payment.expiration_estimate_date).toLocaleString()}
          </p>
        )}

        <div className="rounded-md p-3 mb-4 flex items-start gap-2"
          style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.20)' }}>
          <AlertTriangle size={12} className="text-[var(--warn)] mt-0.5 shrink-0" />
          <p className="text-[11.5px] text-[var(--fg-dim)] leading-relaxed">
            Send the <strong className="text-[var(--fg)]">exact amount</strong>. Underpayment delays confirmation; overpayment can&apos;t be auto-refunded.
          </p>
        </div>

        <button onClick={() => setPayment(null)} className="btn btn-secondary btn-sm w-full">
          New payment
        </button>
      </div>
    )
  }

  // ── Initial picker ──
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Bitcoin size={14} className="text-[#f7931a]" />
        <p className="label-mono">Top up with crypto</p>
        <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-auto"
          style={{ background: 'rgba(247,147,26,0.10)', color: '#f7931a' }}>
          Auto-accept
        </span>
      </div>
      <p className="text-[11.5px] text-[var(--fg-dim)] mb-3">
        12 currencies supported · funds auto-credit on confirmation. Min $5 · Max $5,000.
      </p>

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

      <label className="form-label">Custom amount ($)</label>
      <input
        type="number" min="5" max="5000" step="0.01"
        value={custom}
        onChange={e => { setCustom(e.target.value); setAmount(0) }}
        placeholder="50.00"
        className="form-input mb-3"
        disabled={pending}
      />

      <label className="form-label">Currency</label>
      <select value={currency} onChange={e => setCurrency(e.target.value)} disabled={pending} className="form-input mb-4">
        {CRYPTO.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
      </select>

      {error && <p className="text-[12px] text-[var(--bad)] mb-3">{error}</p>}

      <button onClick={startPayment} disabled={pending} className="btn btn-primary w-full">
        {pending ? <><Loader2 size={13} className="animate-spin" /> Generating address…</> :
          <>Pay {formatPrice(custom ? Math.round(parseFloat(custom || '0') * 100) : amount)} with {CRYPTO.find(c => c.code === currency)?.label} <ArrowRight size={13} /></>}
      </button>
    </div>
  )
}
