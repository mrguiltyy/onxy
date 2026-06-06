'use client'
import { useState, useTransition } from 'react'
import { Power, RotateCw, Trash2, Copy, Check } from 'lucide-react'
import { toggleAppStatus, rotateAppSecret, deleteApplication } from '../actions'

export function ToggleStatusButton({ appId, status }: { appId: string; status: 'active' | 'paused' }) {
  const [pending, start] = useTransition()
  return (
    <button
      onClick={() => start(() => toggleAppStatus(appId, status === 'active' ? 'paused' : 'active'))}
      disabled={pending}
      className="btn btn-secondary btn-sm"
    >
      <Power size={13} /> {status === 'active' ? 'Pause' : 'Resume'}
    </button>
  )
}

export function RotateSecretButton({ appId }: { appId: string }) {
  const [pending, start] = useTransition()
  const [shown, setShown] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function onClick() {
    if (!confirm('Rotate the secret? All currently signed-in users of this app will be logged out next heartbeat. The new secret will be shown ONCE.')) return
    start(async () => {
      const res = await rotateAppSecret(appId)
      if (res.ok && res.app_secret) setShown(res.app_secret)
      else alert(res.error ?? 'Failed.')
    })
  }

  async function copy() {
    if (!shown) return
    await navigator.clipboard.writeText(shown)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <>
      <button onClick={onClick} disabled={pending} className="btn btn-secondary btn-sm">
        <RotateCw size={13} /> Rotate secret
      </button>
      {shown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShown(null)}
        >
          <div
            className="card p-6 max-w-lg w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold text-[16px] mb-2">New app_secret</h3>
            <p className="text-[12.5px] text-[var(--fg-dim)] mb-4">Save this now — it will not be shown again.</p>
            <div className="flex gap-2">
              <code className="flex-1 font-mono text-[12px] px-3 py-2.5 rounded-md break-all"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.20)', color: 'var(--bad)' }}>
                {shown}
              </code>
              <button onClick={copy} className="btn btn-secondary btn-sm shrink-0">
                {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <button onClick={() => setShown(null)} className="btn btn-primary btn-sm mt-4 w-full">
              I&apos;ve saved it — close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export function DeleteAppButton({ appId, name }: { appId: string; name: string }) {
  const [pending, start] = useTransition()

  function onClick() {
    const confirmation = prompt(`Type "${name}" to permanently delete this application and ALL its licenses, sessions, and logs:`)
    if (confirmation !== name) return
    start(() => deleteApplication(appId))
  }

  return (
    <button onClick={onClick} disabled={pending} className="btn btn-sm" style={{
      background: 'rgba(239,68,68,0.08)',
      color: 'var(--bad)',
      border: '1px solid rgba(239,68,68,0.25)',
    }}>
      <Trash2 size={13} /> Delete
    </button>
  )
}
