'use client'
import { useState, useTransition, useRef } from 'react'
import { Loader2, Upload, Check, Image as ImageIcon, X } from 'lucide-react'
import { updateAvatar } from './avatar-actions'
import { AVATAR_PRESETS } from '@/app/onboarding/presets'

interface Props {
  username:    string
  currentUrl:  string | null
}

type Tab = 'preset' | 'upload' | 'url'

export function AvatarEditor({ username, currentUrl }: Props) {
  const [open, setOpen]       = useState(false)
  const [tab, setTab]         = useState<Tab>('preset')
  const [selected, setSelected] = useState<string>(currentUrl ?? '')
  const [urlInput, setUrlInput] = useState('')
  const [pending, start]      = useTransition()
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function save(url: string) {
    setError(null)
    setSuccess(false)
    start(async () => {
      const res = await updateAvatar(url)
      if (!res.ok) { setError(res.error ?? 'Failed.'); return }
      setSelected(url)
      setSuccess(true)
      setTimeout(() => { setOpen(false); setSuccess(false) }, 800)
    })
  }

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) { setError('That doesn\'t look like an image.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Max file size is 5 MB.'); return }

    start(async () => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/profile/avatar-upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.ok || !data.url) {
        setError(data.error ?? 'Upload failed.')
        return
      }
      save(data.url)
    })
  }

  async function onPickFromInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await handleFile(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-4">
      {/* Current avatar (clickable) */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-[22px] font-bold shrink-0 group transition-all hover:ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-[var(--surface)]"
        style={{
          background: currentUrl ? `url(${currentUrl}) center/cover` : 'var(--brand-gradient)',
          color: '#3a2630',
        }}
      >
        {!currentUrl && (username[0]?.toUpperCase() ?? 'U')}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ImageIcon size={16} className="text-white" />
        </div>
      </button>

      <button onClick={() => setOpen(!open)} className="text-[12.5px] text-[var(--brand)] hover:underline">
        Change profile picture
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="card w-full max-w-[640px] max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--hairline)' }}>
              <div>
                <p className="label-mono mb-1">Profile picture</p>
                <p className="text-[12.5px] text-[var(--fg-dim)]">Pick a preset, upload your own, or paste a URL.</p>
              </div>
              <button onClick={() => !pending && setOpen(false)} disabled={pending}
                className="text-[var(--fg-mute)] hover:text-[var(--fg)] p-1">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: 'var(--hairline)' }}>
              <TabBtn label="Presets" active={tab === 'preset'} onClick={() => setTab('preset')} />
              <TabBtn label="Upload"  active={tab === 'upload'} onClick={() => setTab('upload')} />
              <TabBtn label="URL"     active={tab === 'url'}    onClick={() => setTab('url')} />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {tab === 'preset' && (
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map(p => (
                    <button
                      key={p.url}
                      onClick={() => save(p.url)}
                      disabled={pending}
                      className="aspect-square rounded-md overflow-hidden border-2 transition-all hover:scale-105"
                      style={{
                        borderColor: selected === p.url ? 'var(--brand)' : 'transparent',
                        background: 'var(--surface-2)',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.alt} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {tab === 'upload' && (
                <div
                  className="border-2 border-dashed rounded-md py-12 text-center"
                  style={{ borderColor: 'var(--hairline)', background: 'var(--surface-2)' }}
                >
                  <Upload size={28} className="mx-auto mb-2 text-[var(--brand)]" />
                  <p className="text-[13px] font-medium mb-1">Upload from your device</p>
                  <p className="text-[11.5px] text-[var(--fg-mute)] mb-4">PNG · JPG · WEBP — max 5 MB</p>
                  <button onClick={() => fileRef.current?.click()} disabled={pending} className="btn btn-primary btn-sm">
                    {pending ? <><Loader2 size={12} className="animate-spin" /> Uploading…</> : 'Browse files'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPickFromInput} className="hidden" />
                </div>
              )}

              {tab === 'url' && (
                <div>
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com/me.png"
                    className="form-input mb-3"
                  />
                  <button onClick={() => save(urlInput.trim())} disabled={pending || !urlInput.trim()}
                    className="btn btn-primary btn-sm">
                    {pending ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : 'Use this URL'}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-3 text-[12px] text-[var(--bad)] flex items-start gap-1.5">
                  <X size={12} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}
              {success && (
                <div className="mt-3 text-[12px] text-[var(--ok)] flex items-center gap-1.5">
                  <Check size={12} /> Saved!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex-1 px-4 py-2.5 text-[12.5px] transition-colors"
      style={{
        color: active ? 'var(--brand)' : 'var(--fg-dim)',
        background: active ? 'var(--brand-faint)' : 'transparent',
        borderBottom: active ? '2px solid var(--brand)' : '2px solid transparent',
      }}>
      {label}
    </button>
  )
}
