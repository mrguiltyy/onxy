'use client'
import { useState, useTransition } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { approveResellerGrant, rejectResellerGrant } from '../products/actions'

export function GrantActions({ grantId }: { grantId: string }) {
  const [pending, start] = useTransition()
  const [showReject, setShowReject] = useState(false)
  const [discount, setDiscount] = useState('0')
  const [error, setError] = useState<string | null>(null)

  function onApprove() {
    setError(null)
    const pct = parseInt(discount, 10)
    if (Number.isNaN(pct) || pct < 0 || pct > 100) { setError('Discount must be 0–100.'); return }
    start(async () => {
      const res = await approveResellerGrant(grantId, pct)
      if (!res.ok) setError(res.error ?? 'Failed.')
    })
  }

  function onReject(formData: FormData) {
    setError(null)
    const reason = String(formData.get('reason') ?? '').trim()
    start(async () => {
      const res = await rejectResellerGrant(grantId, reason)
      if (!res.ok) setError(res.error ?? 'Failed.')
      else setShowReject(false)
    })
  }

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-1.5">
        <label className="text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider">discount %</label>
        <input
          type="number"
          min={0}
          max={100}
          value={discount}
          onChange={e => setDiscount(e.target.value)}
          className="form-input w-14 px-2 py-1 text-[12px] tabular-nums text-center"
          disabled={pending}
        />
      </div>
      <div className="flex gap-1.5">
        <button onClick={() => setShowReject(true)} disabled={pending} className="btn btn-sm"
          style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--bad)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <X size={12} /> Reject
        </button>
        <button onClick={onApprove} disabled={pending} className="btn btn-primary btn-sm">
          {pending ? <Loader2 size={12} className="animate-spin" /> : <><Check size={12} /> Approve</>}
        </button>
      </div>
      {error && <p className="text-[11px] text-[var(--bad)]">{error}</p>}

      {showReject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => !pending && setShowReject(false)}
        >
          <form
            action={onReject}
            className="card p-5 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-[15px] mb-2">Reject application</h3>
            <p className="text-[12px] text-[var(--fg-dim)] mb-3">Reason is shown to the reseller.</p>
            <textarea name="reason" required rows={4} maxLength={500} placeholder="Not a good fit, audience too small, …"
              className="form-input resize-none font-[inherit] mb-3" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowReject(false)} disabled={pending} className="btn btn-secondary btn-sm flex-1">Cancel</button>
              <button type="submit" disabled={pending} className="btn btn-sm flex-1"
                style={{ background: 'rgba(239,68,68,0.10)', color: 'var(--bad)', border: '1px solid rgba(239,68,68,0.30)' }}>
                {pending ? <Loader2 size={12} className="animate-spin" /> : 'Reject'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
