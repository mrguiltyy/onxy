'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Eye, EyeOff, FileText, Bold, Italic, Code as CodeIcon, Link as LinkIcon, List, Heading, ImageIcon, Trash2 } from 'lucide-react'
import { md } from '@/lib/markdown'
import { savePage, deletePage } from './actions'

interface Initial {
  id?:               string
  slug?:             string
  page_type?:        string
  title?:            string
  subtitle?:         string | null
  body?:             string
  status?:           string
  featured?:         boolean
  meta_title?:       string | null
  meta_description?: string | null
  meta_keywords?:    string[]
  og_image_url?:     string | null
}

const TYPES = [
  { value: 'page',         label: 'Generic page' },
  { value: 'faq',          label: 'FAQ entry' },
  { value: 'blog',         label: 'Blog post' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'giveaway',     label: 'Giveaway' },
]

export function PageEditor({ initial = {} }: { initial?: Initial }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!initial.id

  const [title,    setTitle]    = useState(initial.title    ?? '')
  const [slug,     setSlug]     = useState(initial.slug     ?? '')
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? '')
  const [body,     setBody]     = useState(initial.body     ?? '')
  const [type,     setType]     = useState(initial.page_type ?? 'page')
  const [status,   setStatus]   = useState(initial.status   ?? 'draft')
  const [featured, setFeatured] = useState(initial.featured ?? false)
  const [preview,  setPreview]  = useState(true)

  const [metaTitle,       setMetaTitle]       = useState(initial.meta_title       ?? '')
  const [metaDescription, setMetaDescription] = useState(initial.meta_description ?? '')
  const [metaKeywords,    setMetaKeywords]    = useState((initial.meta_keywords ?? []).join(', '))
  const [ogImage,         setOgImage]         = useState(initial.og_image_url     ?? '')

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
  }

  function onTitleChange(value: string) {
    setTitle(value)
    if (!isEdit && (!slug || slug === slugify(title))) setSlug(slugify(value))
  }

  function insertMd(before: string, after = '') {
    const ta = document.getElementById('md-editor') as HTMLTextAreaElement | null
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const sel = body.slice(start, end)
    const next = body.slice(0, start) + before + sel + after + body.slice(end)
    setBody(next)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, start + before.length + sel.length) }, 0)
  }

  function save() {
    setError(null)
    start(async () => {
      const res = await savePage({
        id: initial.id,
        slug, title, subtitle, body, page_type: type, status, featured,
        meta_title:       metaTitle,
        meta_description: metaDescription,
        meta_keywords:    metaKeywords,
        og_image_url:     ogImage,
      })
      if (!res.ok) { setError(res.error ?? 'Failed.'); return }
      router.push('/admin/pages')
      router.refresh()
    })
  }

  function doDelete() {
    if (!initial.id) return
    if (!confirm(`Delete "${title}" permanently?`)) return
    start(async () => {
      await deletePage(initial.id!)
      router.push('/admin/pages')
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      {/* Top metadata bar */}
      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="form-label">Title</label>
            <input value={title} onChange={e => onTitleChange(e.target.value)} required className="form-input" />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="form-input">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="form-label">Subtitle (optional)</label>
            <input value={subtitle ?? ''} onChange={e => setSubtitle(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Slug</label>
            <input value={slug} onChange={e => setSlug(slugify(e.target.value))} required pattern="[a-z0-9-]+"
              className="form-input font-mono text-[12px]" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="form-label">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="form-input">
              <option value="draft">Draft (only you)</option>
              <option value="published">Published (live)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-[13px] mt-5">
            <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="accent-[var(--brand)]" />
            Featured
          </label>
        </div>
      </div>

      {/* Editor + preview */}
      <div className="card overflow-hidden">
        <div className="px-3 py-2 border-b border-[var(--hairline)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <ToolBtn onClick={() => insertMd('## ', '')}    label="H2"     icon={<Heading size={12} />} />
            <ToolBtn onClick={() => insertMd('**', '**')}    label="Bold"   icon={<Bold size={12} />} />
            <ToolBtn onClick={() => insertMd('*', '*')}      label="Italic" icon={<Italic size={12} />} />
            <ToolBtn onClick={() => insertMd('`', '`')}      label="Code"   icon={<CodeIcon size={12} />} />
            <ToolBtn onClick={() => insertMd('[', '](https://)')} label="Link" icon={<LinkIcon size={12} />} />
            <ToolBtn onClick={() => insertMd('- ', '')}      label="List"   icon={<List size={12} />} />
            <ToolBtn onClick={() => insertMd('![alt](', ')')} label="Image" icon={<ImageIcon size={12} />} />
          </div>
          <button
            onClick={() => setPreview(!preview)}
            className="text-[11.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1"
          >
            {preview ? <><EyeOff size={11} /> Hide preview</> : <><Eye size={11} /> Show preview</>}
          </button>
        </div>

        <div className={`grid ${preview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} divide-x`} style={{ borderColor: 'var(--hairline)' }}>
          <textarea
            id="md-editor"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={preview ? 22 : 28}
            placeholder="# Heading&#10;&#10;Write **markdown** here…"
            className="w-full p-5 font-mono text-[13px] leading-[1.6] bg-transparent outline-none resize-y"
            style={{ borderColor: 'var(--hairline)' }}
          />
          {preview && (
            <div
              className="p-5 prose-cms overflow-auto max-h-[80vh]"
              style={{ borderColor: 'var(--hairline)' }}
              dangerouslySetInnerHTML={{ __html: md(body) }}
            />
          )}
        </div>
      </div>

      {/* SEO */}
      <details className="card overflow-hidden">
        <summary className="px-5 py-3 cursor-pointer text-[13px] font-semibold flex items-center gap-2 border-b border-[var(--hairline)]">
          <FileText size={12} className="text-[var(--brand)]" /> SEO
        </summary>
        <div className="p-5 space-y-3">
          <div>
            <label className="form-label">Meta title (override)</label>
            <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Meta description</label>
            <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={2}
              maxLength={300} className="form-input resize-none font-[inherit]" />
          </div>
          <div>
            <label className="form-label">Keywords (comma-separated)</label>
            <input value={metaKeywords} onChange={e => setMetaKeywords(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">OG image URL</label>
            <input value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="https://..." className="form-input" />
          </div>
        </div>
      </details>

      {error && (
        <div className="text-[12.5px] text-[var(--bad)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 sticky bottom-4 z-10">
        <button onClick={save} disabled={pending} className="btn btn-primary">
          {pending ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> {isEdit ? 'Save' : 'Create'}</>}
        </button>
        {isEdit && (
          <button onClick={doDelete} disabled={pending} className="btn btn-sm"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--bad)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <Trash2 size={12} /> Delete
          </button>
        )}
      </div>
    </div>
  )
}

function ToolBtn({ onClick, label, icon }: { onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label}
      className="px-2 py-1.5 rounded text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors">
      {icon}
    </button>
  )
}
