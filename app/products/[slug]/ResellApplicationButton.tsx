'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Clock, Loader2, X } from 'lucide-react'
import { submitResellApplication } from './actions'

interface Props {
  productId:           string
  productName:         string
  signedIn:            boolean
  isReseller:          boolean
  existingGrantStatus: string | null     // pending / approved / rejected / revoked / null
}

export function ResellApplicationButton({ productId, productName, signedIn, isReseller, existingGrantStatus }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // ── Not signed in ──
  if (!signedIn) {
    return (
      <Link href="/register?intent=reseller" className="btn btn-secondary w-full">
        Sign up to apply <ArrowRight size={13} />
      </Link>
    )
  }

  // ── Signed in but not a reseller yet ──
  if (!isReseller) {
    return (
      <Link href="/dashboard/account?tab=reseller" className="btn btn-secondary w-full">
        Become a reseller first
      </Link>
    )
  }

  // ── Existing application status ──
  if (existingGrantStatus === 'pending') {
    return (
      <div className="text-center px-3 py-2.5 rounded-md text-[12.5px] font-medium inline-flex items-center justify-center gap-2 w-full"
        style={{ background: 'rgba(250,204,21,0.10)', color: 'var(--warn)', border: '1px solid rgba(250,204,21,0.25)' }}>
        <Clock size={12} /> Application pending
      </div>
    )
  }

  if (existingGrantStatus === 'approved') {
    return (
      <Link href="/dashboard/resells" className="btn btn-primary w-full">
        <Check size={13} /> Approved — Manage
      </Link>
    )
  }

  if (existingGrantStatus === 'rejected' || existingGrantStatus === 'revoked') {
    return (
      <div className="text-center px-3 py-2.5 rounded-md text-[12.5px] font-medium inline-flex items-center justify-center gap-2 w-full"
        style={{ background: 'rgba(239,68,68,0.07)', color: 'var(--bad)', border: '1px solid rgba(239,68,68,0.20)' }}>
        Application {existingGrantStatus}
      </div>
    )
  }

  // ── Open application form ──
  return (
    <>
      <button onClick={() => { setOpen(true); setError(null); setDone(false); }} className="btn btn-primary w-full">
        Apply to resell <ArrowRight size={13} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => !pending && setOpen(false)}
        >
          <div className="card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1">
              <p className="label-mono">Reseller program</p>
              <button onClick={() => !pending && setOpen(false)} className="text-[var(--fg-mute)] hover:text-[var(--fg)]" disabled={pending}>
                <X size={14} />
              </button>
            </div>
            <h3 className="font-bold text-[18px] mb-1">Apply to resell {productName}</h3>
            <p className="text-[12.5px] text-[var(--fg-dim)] mb-5">
              Tell us how you&apos;ll resell it — your audience, your custom branding, anything else relevant.
            </p>

            {done ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-faint)' }}>
                  <Check size={20} className="text-[var(--brand)]" />
                </div>
                <p className="font-semibold text-[14px] mb-1">Application submitted</p>
                <p className="text-[12.5px] text-[var(--fg-dim)] mb-4">
                  We&apos;ll review and reply within 24 hours. You&apos;ll be notified in your dashboard.
                </p>
                <button onClick={() => setOpen(false)} className="btn btn-primary btn-sm">Close</button>
              </div>
            ) : (
              <form
                action={(formData) => {
                  setError(null)
                  start(async () => {
                    const res = await submitResellApplication(productId, formData)
                    if (!res.ok) { setError(res.error ?? 'Failed.'); return }
                    setDone(true)
                  })
                }}
                className="space-y-3"
              >
                <div>
                  <label className="form-label">Your branded name <span className="text-[var(--fg-mute)]">(what you&apos;ll call it)</span></label>
                  <input name="custom_name" required maxLength={80} placeholder="e.g. Phoenix Tool" className="form-input" autoComplete="off" />
                </div>

                <div>
                  <label className="form-label">Custom image URL <span className="text-[var(--fg-mute)]">(optional)</span></label>
                  <input name="custom_image" maxLength={400} placeholder="https://..." className="form-input" autoComplete="off" />
                </div>

                <div>
                  <label className="form-label">Pitch <span className="text-[var(--fg-mute)]">(audience, channels, expected volume)</span></label>
                  <textarea name="pitch" required rows={4} minLength={20} maxLength={1000}
                    placeholder="I run a Discord server with 5k members focused on..."
                    className="form-input resize-none font-[inherit]" />
                </div>

                {error && (
                  <div className="text-[12.5px] text-[var(--bad)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm flex-1" disabled={pending}>Cancel</button>
                  <button type="submit" disabled={pending} className="btn btn-primary btn-sm flex-1">
                    {pending ? <><Loader2 size={13} className="animate-spin" /> Submitting…</> : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
