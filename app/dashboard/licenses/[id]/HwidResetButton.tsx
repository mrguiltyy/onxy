'use client'
import { useState, useTransition } from 'react'
import { RefreshCw, Loader2, Check, X } from 'lucide-react'
import { resetHwid } from './actions'

interface Props {
  licenseId:      string
  resetsLeft:     number
  canResetByTime: boolean
  nextResetAt:    string | null   // when they can reset next (if rate-limited)
}

export function HwidResetButton({ licenseId, resetsLeft, canResetByTime, nextResetAt }: Props) {
  const [pending, start] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const disabled = resetsLeft <= 0 || !canResetByTime || pending

  function onConfirm() {
    setError(null)
    start(async () => {
      const res = await resetHwid(licenseId)
      if (!res.ok) { setError(res.error ?? 'Failed.'); setConfirming(false); return }
      setDone(true)
      setConfirming(false)
    })
  }

  if (done) {
    return (
      <div className="rounded-md p-3 flex items-center gap-2"
        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
        <Check size={14} className="text-[var(--ok)]" />
        <p className="text-[12.5px] text-[var(--ok)]">
          HWID cleared. Reopen your tool and log in — your new hardware will be bound automatically.
        </p>
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="rounded-md p-3"
        style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.25)' }}>
        <p className="text-[13px] font-semibold mb-1">Reset HWID?</p>
        <p className="text-[12px] text-[var(--fg-dim)] mb-3">
          You&apos;ll have <strong>{resetsLeft - 1}</strong> reset{resetsLeft - 1 === 1 ? '' : 's'} left after this.
          Any tools currently logged in with this key will be kicked.
        </p>
        <div className="flex gap-2">
          <button onClick={() => setConfirming(false)} className="btn btn-secondary btn-sm flex-1" disabled={pending}>
            <X size={12} /> Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-primary btn-sm flex-1" disabled={pending}>
            {pending ? <Loader2 size={12} className="animate-spin" /> : <><RefreshCw size={12} /> Reset now</>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setConfirming(true)} disabled={disabled} className="btn btn-primary btn-sm">
        <RefreshCw size={12} /> Reset HWID
      </button>
      {resetsLeft <= 0 && (
        <p className="text-[11.5px] text-[var(--bad)] mt-2">No resets remaining. Open a ticket for help.</p>
      )}
      {resetsLeft > 0 && !canResetByTime && nextResetAt && (
        <p className="text-[11.5px] text-[var(--warn)] mt-2">
          Next reset available in {Math.ceil((new Date(nextResetAt).getTime() - Date.now()) / 3_600_000)}h.
        </p>
      )}
      {error && <p className="text-[11.5px] text-[var(--bad)] mt-2">{error}</p>}
    </div>
  )
}
