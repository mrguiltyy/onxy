'use client'
import { useState, useTransition } from 'react'
import { Copy, Check, Trash2, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react'
import { createApiKey, deleteApiKey } from './actions'

interface KeyRowDisplay {
  id:              string
  key_prefix:      string
  name:            string
  active:          boolean
  last_used_label: string
  request_count:   number
  created_label:   string
}

export function CreateKeyForm() {
  const [name, setName] = useState('Default key')
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function create() {
    setError(null)
    start(async () => {
      const res = await createApiKey(name.trim() || 'Default key')
      if (!res.ok) { setError(res.error ?? 'Failed.'); return }
      if (res.fullKey) setCreated(res.fullKey)
    })
  }

  async function copy() {
    if (!created) return
    await navigator.clipboard.writeText(created)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (created) {
    return (
      <div>
        <div className="rounded-md p-4 mb-4 flex items-start gap-3"
          style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.25)' }}>
          <AlertTriangle size={14} className="text-[var(--warn)] mt-0.5 shrink-0" />
          <div className="text-[12.5px] text-[var(--fg-dim)]">
            <strong className="text-[var(--fg)]">Save this key now.</strong> It will not be shown again.
            If you lose it, you&apos;ll need to delete and create a new one.
          </div>
        </div>
        <p className="form-label">Your new API key</p>
        <div className="flex items-stretch gap-2">
          <code className="flex-1 font-mono text-[11.5px] px-3 py-2.5 rounded-md break-all"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.20)', color: 'var(--bad)' }}>
            {created}
          </code>
          <button onClick={copy} className="btn btn-secondary btn-sm shrink-0">
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <button onClick={() => { setCreated(null); setName('Default key') }} className="btn btn-primary btn-sm mt-4">
          Done — create another
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label className="form-label">Key name (so you remember what it&apos;s for)</label>
          <input
            value={name}
            onChange={e => setName(e.target.value.slice(0, 80))}
            placeholder="e.g. Production backend"
            className="form-input"
          />
        </div>
        <button onClick={create} disabled={pending || !name.trim()} className="btn btn-primary">
          {pending ? <><Loader2 size={12} className="animate-spin" /> Generating…</> : 'Generate key'}
        </button>
      </div>
      {error && <p className="text-[12px] text-[var(--bad)] mt-2">{error}</p>}
      <p className="text-[10.5px] text-[var(--fg-mute)] mt-2">
        Keys grant full API access to your reseller account. Treat them like passwords.
      </p>
    </div>
  )
}

export function KeysList({ keys }: { keys: KeyRowDisplay[] }) {
  const [shown, setShown] = useState<string | null>(null)

  return (
    <div className="divide-y" style={{ borderColor: 'var(--hairline)' }}>
      {keys.map(k => (
        <KeyRow key={k.id} k={k} shown={shown === k.id} setShown={(v) => setShown(v ? k.id : null)} />
      ))}
    </div>
  )
}

function KeyRow({ k, shown, setShown }: { k: KeyRowDisplay; shown: boolean; setShown: (v: boolean) => void }) {
  const [pending, start] = useTransition()
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(k.key_prefix)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function remove() {
    if (!confirm(`Delete API key "${k.name}"? Applications using this key will stop working immediately.`)) return
    start(async () => {
      await deleteApiKey(k.id)
    })
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[13.5px] truncate">{k.name}</p>
          <p className="text-[10.5px] text-[var(--fg-mute)] mt-0.5">
            Last used: {k.last_used_label} · {k.request_count} requests · created {k.created_label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShown(!shown)}
            className="text-[11px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1">
            {shown ? <><EyeOff size={10} /> Hide</> : <><Eye size={10} /> Show prefix</>}
          </button>
          <button onClick={remove} disabled={pending}
            className="text-[11px] text-[var(--bad)] hover:underline inline-flex items-center gap-1">
            {pending ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />} Delete
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 font-mono text-[11.5px] px-3 py-2 rounded-md"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', color: 'var(--brand)' }}>
          {shown ? `${k.key_prefix}:` : `${k.key_prefix.slice(0, 8)}••••••••`}
          <span className="text-[var(--fg-mute)]">••••••••••••••••</span>
        </code>
        <button onClick={copy} className="btn btn-secondary btn-sm shrink-0">
          {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /></>}
        </button>
      </div>
    </div>
  )
}
