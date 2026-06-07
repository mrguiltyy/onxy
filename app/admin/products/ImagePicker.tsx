'use client'
import { useState, useEffect, useTransition, useRef, useCallback } from 'react'
import { Upload, Trash2, Loader2, Check, X, Image as ImageIcon, Wand2, RefreshCw } from 'lucide-react'
import { uploadProductImage, listProductImages, deleteProductImage, type ProductImage } from './image-actions'
import { BannerGenerator } from './BannerGenerator'

interface Props {
  value:    string                          // currently selected URL (could be uploaded path or external URL)
  onChange: (url: string) => void
  hint?:    string
}

type Tab = 'library' | 'upload' | 'url' | 'generator'

export function ImagePicker({ value, onChange, hint }: Props) {
  const [tab, setTab]         = useState<Tab>('library')
  const [images, setImages]   = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [pending, start]      = useTransition()
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    const res = await listProductImages()
    if (!res.ok) setError(res.error ?? 'Failed to load.')
    else setImages(res.images ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Sync the URL input to the current value (for switching tabs)
  useEffect(() => { setUrlInput(value) }, [value])

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) { setError('That doesn\'t look like an image.'); return }
    if (file.size > 10 * 1024 * 1024)    { setError('Max file size is 10 MB.'); return }

    start(async () => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadProductImage(fd)
      if (!res.ok) { setError(res.error ?? 'Upload failed.'); return }
      if (res.url) {
        onChange(res.url)
        await refresh()
        setTab('library')
      }
    })
  }

  async function onPickFromInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await handleFile(file)
    e.target.value = ''
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (dropRef.current) dropRef.current.style.borderColor = 'var(--brand)'
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    if (dropRef.current) dropRef.current.style.borderColor = ''
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    if (dropRef.current) dropRef.current.style.borderColor = ''
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  async function remove(path: string) {
    if (!confirm('Delete this image? Products using it will keep working but the URL will 404.')) return
    start(async () => {
      const res = await deleteProductImage(path)
      if (!res.ok) { setError(res.error ?? 'Delete failed.'); return }
      if (value.includes(path)) onChange('')
      await refresh()
    })
  }

  return (
    <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--hairline)' }}>

      {/* Selected preview */}
      {value && (
        <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--hairline)', background: 'var(--surface-2)' }}>
          <div
            className="w-12 h-12 rounded-md shrink-0 overflow-hidden"
            style={{ background: `url(${value}) center/cover`, border: '1px solid var(--hairline)' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider mb-0.5">Selected hero image</p>
            <p className="text-[12px] font-mono text-[var(--fg-dim)] truncate">{value}</p>
          </div>
          <button type="button" onClick={() => onChange('')}
            className="text-[var(--fg-mute)] hover:text-[var(--bad)] transition-colors p-1.5">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b text-[12px]" style={{ borderColor: 'var(--hairline)' }}>
        <TabBtn label="Library"   icon={<ImageIcon size={11} />} active={tab === 'library'}   onClick={() => setTab('library')} />
        <TabBtn label="Upload"    icon={<Upload size={11} />}    active={tab === 'upload'}    onClick={() => setTab('upload')} />
        <TabBtn label="Generate"  icon={<Wand2 size={11} />}     active={tab === 'generator'} onClick={() => setTab('generator')} />
        <TabBtn label="External URL" icon={null}                  active={tab === 'url'}       onClick={() => setTab('url')} />
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="rounded-md px-3 py-2 mb-3 text-[12px] text-[var(--bad)]"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)' }}>
            {error}
          </div>
        )}

        {tab === 'library' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider">
                {loading ? 'Loading…' : `${images.length} image${images.length === 1 ? '' : 's'} in library`}
              </p>
              <button type="button" onClick={refresh} disabled={loading}
                className="text-[11.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1">
                <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-video rounded-md" style={{ background: 'var(--surface-2)' }} />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="py-12 text-center">
                <ImageIcon size={28} className="mx-auto mb-2 text-[var(--fg-faint)]" />
                <p className="text-[12.5px] text-[var(--fg-dim)] mb-3">No uploaded images yet.</p>
                <button type="button" onClick={() => setTab('upload')} className="btn btn-primary btn-sm">
                  <Upload size={12} /> Upload one
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-1">
                {images.map(img => (
                  <div
                    key={img.path}
                    className="aspect-video rounded-md overflow-hidden relative group cursor-pointer"
                    style={{
                      background: `url(${img.url}) center/cover, var(--surface-2)`,
                      border: value === img.url ? '2px solid var(--brand)' : '1px solid var(--hairline)',
                      boxShadow: value === img.url ? '0 0 0 2px rgba(240,164,183,0.20)' : 'none',
                    }}
                    onClick={() => onChange(img.url)}
                  >
                    {value === img.url && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--brand)', color: '#0a0d14' }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); remove(img.path) }}
                      className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                      title="Delete"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'upload' && (
          <div
            ref={dropRef}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className="border-2 border-dashed rounded-md py-10 text-center transition-colors"
            style={{ borderColor: 'var(--hairline)', background: 'var(--surface-2)' }}
          >
            <Upload size={28} className="mx-auto mb-2 text-[var(--brand)]" />
            <p className="text-[13px] font-medium mb-1">Drop an image here</p>
            <p className="text-[11.5px] text-[var(--fg-mute)] mb-4">PNG · JPG · WEBP · SVG — max 10 MB</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={pending}
              className="btn btn-primary btn-sm"
            >
              {pending ? <><Loader2 size={12} className="animate-spin" /> Uploading…</> : <>Browse files</>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickFromInput} className="hidden" />
          </div>
        )}

        {tab === 'generator' && (
          <BannerGenerator
            onGenerated={(url) => { onChange(url); refresh(); setTab('library') }}
          />
        )}

        {tab === 'url' && (
          <div>
            <label className="form-label">External image URL</label>
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://example.com/banner.png"
              className="form-input"
            />
            <p className="text-[11px] text-[var(--fg-mute)] mt-1.5 mb-3">
              Use this if your image lives on a CDN or you already have a URL. We won&apos;t re-host it.
            </p>
            <button
              type="button"
              onClick={() => onChange(urlInput.trim())}
              disabled={!urlInput.trim()}
              className="btn btn-primary btn-sm"
            >
              Use this URL
            </button>
          </div>
        )}
      </div>

      {hint && <p className="px-4 pb-3 text-[11px] text-[var(--fg-mute)]">{hint}</p>}
    </div>
  )
}

function TabBtn({ label, icon, active, onClick }: { label: string; icon: React.ReactNode | null; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2.5 inline-flex items-center gap-1.5 transition-colors"
      style={{
        color:       active ? 'var(--brand)' : 'var(--fg-dim)',
        background:  active ? 'var(--brand-faint)' : 'transparent',
        borderBottom: active ? '2px solid var(--brand)' : '2px solid transparent',
      }}
    >
      {icon} {label}
    </button>
  )
}
