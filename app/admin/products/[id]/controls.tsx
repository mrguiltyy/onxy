'use client'
import { useState, useTransition } from 'react'
import { Loader2, Megaphone, Trash2, X } from 'lucide-react'
import { publishProductUpdate, deleteProduct } from '../actions'

export function PublishUpdateButton({ productId, currentVersion }: { productId: string; currentVersion: string }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    start(async () => {
      const res = await publishProductUpdate(productId, formData)
      if (!res.ok) { setError(res.error ?? 'Failed.'); return }
      setOpen(false)
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">
        <Megaphone size={12} /> Publish update
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => !pending && setOpen(false)}
        >
          <div className="card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1">
              <p className="label-mono">New release</p>
              <button onClick={() => !pending && setOpen(false)} className="text-[var(--fg-mute)] hover:text-[var(--fg)]" disabled={pending}>
                <X size={14} />
              </button>
            </div>
            <h3 className="font-bold text-[16px] mb-1">Publish update</h3>
            <p className="text-[12px] text-[var(--fg-dim)] mb-4">
              All approved resellers will be notified. Current version: <span className="font-mono text-[var(--brand)]">{currentVersion}</span>
            </p>

            <form action={onSubmit} className="space-y-3">
              <div>
                <label className="form-label">New version</label>
                <input name="version" required placeholder="1.1.0" className="form-input font-mono" />
              </div>

              <div>
                <label className="form-label">Title</label>
                <input name="title" required maxLength={200} placeholder="Added X, fixed Y" className="form-input" />
              </div>

              <div>
                <label className="form-label">Release notes (markdown ok)</label>
                <textarea name="notes" rows={5} maxLength={4000} className="form-input resize-none font-[inherit]" />
              </div>

              <div>
                <label className="form-label">Severity</label>
                <select name="severity" defaultValue="minor" className="form-input">
                  <option value="patch">Patch (bug fix)</option>
                  <option value="minor">Minor (new feature)</option>
                  <option value="major">Major (large changes)</option>
                  <option value="breaking">Breaking</option>
                </select>
              </div>

              {error && (
                <div className="text-[12.5px] text-[var(--bad)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} disabled={pending} className="btn btn-secondary btn-sm flex-1">Cancel</button>
                <button type="submit" disabled={pending} className="btn btn-primary btn-sm flex-1">
                  {pending ? <><Loader2 size={12} className="animate-spin" /> Publishing…</> : 'Publish + notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export function DeleteProductButton({ productId, name }: { productId: string; name: string }) {
  const [pending, start] = useTransition()
  function onClick() {
    const c = prompt(`Type "${name}" to permanently delete this product (licenses with this product remain but unlinked):`)
    if (c !== name) return
    start(() => deleteProduct(productId))
  }
  return (
    <button onClick={onClick} disabled={pending} className="btn btn-sm" style={{
      background: 'rgba(239,68,68,0.08)', color: 'var(--bad)', border: '1px solid rgba(239,68,68,0.25)',
    }}>
      <Trash2 size={12} /> Delete
    </button>
  )
}
