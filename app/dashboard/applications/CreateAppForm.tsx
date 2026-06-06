'use client'
import { useState, useTransition } from 'react'
import { Copy, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { createApplication } from './actions'

interface CreatedCreds {
  app_id: string
  app_secret: string
  name: string
}

export function CreateAppForm() {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedCreds | null>(null)
  const [copied, setCopied] = useState<'id' | 'secret' | null>(null)

  function onSubmit(formData: FormData) {
    setError(null)
    start(async () => {
      const res = await createApplication(formData)
      if (!res.ok) {
        setError(res.error ?? 'Failed.')
        return
      }
      setCreated({ app_id: res.app_id!, app_secret: res.app_secret!, name: res.name! })
    })
  }

  async function copy(value: string, which: 'id' | 'secret') {
    await navigator.clipboard.writeText(value)
    setCopied(which)
    setTimeout(() => setCopied(null), 1400)
  }

  if (created) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-md p-4 flex items-start gap-3"
          style={{ background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.25)' }}
        >
          <AlertTriangle size={16} className="text-[var(--warn)] mt-0.5 shrink-0" />
          <div className="text-[12.5px] text-[var(--fg-dim)]">
            <strong className="text-[var(--fg)]">Save your app secret now.</strong> It will not be shown again. If you lose it, you&apos;ll need to rotate it (which logs out all existing users of <em>{created.name}</em>).
          </div>
        </div>

        <CredBox
          label="app_id"
          value={created.app_id}
          onCopy={() => copy(created.app_id, 'id')}
          copied={copied === 'id'}
          hint="Public — embed this in your tool."
        />
        <CredBox
          label="app_secret"
          value={created.app_secret}
          onCopy={() => copy(created.app_secret, 'secret')}
          copied={copied === 'secret'}
          hint="Private — never expose this in client-side code."
          sensitive
        />

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => { setCreated(null); }}
            className="btn btn-secondary btn-sm"
          >
            Create another
          </button>
          <a href="/dashboard/docs" className="btn btn-primary btn-sm">
            View integration docs →
          </a>
        </div>
      </div>
    )
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <label className="form-label">Name</label>
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder="My Tool"
          className="form-input"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="form-label">Description <span className="text-[var(--fg-mute)]">(optional)</span></label>
        <input
          name="description"
          maxLength={240}
          placeholder="Internal description for your reference"
          className="form-input"
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="form-label">Version</label>
          <input
            name="version"
            defaultValue="1.0.0"
            className="form-input"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-2 pt-6">
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input type="checkbox" name="hwid_lock" defaultChecked className="accent-[var(--brand)]" />
            HWID lock (recommended)
          </label>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input type="checkbox" name="version_check" className="accent-[var(--brand)]" />
            Strict version match
          </label>
        </div>
      </div>

      {error && (
        <div className="text-[12.5px] text-[var(--bad)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create application'}
      </button>
    </form>
  )
}

function CredBox({ label, value, onCopy, copied, hint, sensitive }: {
  label: string; value: string; onCopy: () => void; copied: boolean; hint: string; sensitive?: boolean
}) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex items-stretch gap-2">
        <code
          className="flex-1 font-mono text-[12.5px] px-3 py-2.5 rounded-md break-all"
          style={{
            background: sensitive ? 'rgba(239,68,68,0.05)' : 'var(--surface-2)',
            border: `1px solid ${sensitive ? 'rgba(239,68,68,0.20)' : 'var(--hairline)'}`,
            color: sensitive ? 'var(--bad)' : 'var(--brand)',
          }}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="btn btn-secondary btn-sm shrink-0"
          title="Copy"
        >
          {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
        </button>
      </div>
      <p className="text-[11.5px] text-[var(--fg-mute)] mt-1">{hint}</p>
    </div>
  )
}
