import Link from 'next/link'
import { Plus, ExternalLink, Edit2, FileText, Megaphone, BookOpen, HelpCircle, Sparkles } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { relativeTime } from '@/lib/utils'

export const metadata = { title: 'CMS · Admin' }
export const dynamic = 'force-dynamic'

interface CmsRow {
  id:         string
  slug:       string
  page_type:  string
  title:      string
  status:     string
  featured:   boolean
  view_count: number
  published_at: string | null
  updated_at:   string
}

const TYPE_CFG = {
  page:         { icon: FileText,    label: 'Page',         tone: 'pend' as const, urlPrefix: '/' },
  faq:          { icon: HelpCircle,  label: 'FAQ entry',    tone: 'brand' as const, urlPrefix: '/faq/' },
  blog:         { icon: BookOpen,    label: 'Blog post',    tone: 'ok' as const, urlPrefix: '/blog/' },
  announcement: { icon: Megaphone,   label: 'Announcement', tone: 'warn' as const, urlPrefix: '/announcements/' },
  giveaway:     { icon: Sparkles,    label: 'Giveaway',     tone: 'brand' as const, urlPrefix: '/giveaways/' },
}

export default async function AdminPagesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams
  const filter = params.type ?? 'all'

  const admin = supabaseAdmin()
  let query = admin
    .from('cms_pages')
    .select('id, slug, page_type, title, status, featured, view_count, published_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(200)
  if (filter !== 'all') query = query.eq('page_type', filter)

  const { data } = await query
  const pages = (data as CmsRow[] | null) ?? []

  // Counts per type
  const counts = { page: 0, faq: 0, blog: 0, announcement: 0, giveaway: 0 }
  const { data: allPages } = await admin.from('cms_pages').select('page_type')
  for (const p of (allPages as { page_type: string }[] | null) ?? []) {
    if (p.page_type in counts) counts[p.page_type as keyof typeof counts]++
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">Pages, blog, FAQ &amp; announcements</h1>
          <p className="text-[13px] text-[var(--fg-dim)] mt-1">Markdown-driven CMS. Everything renders publicly when published.</p>
        </div>
        <Link href="/admin/pages/new" className="btn btn-primary">
          <Plus size={13} /> New page
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterChip href="/admin/pages" label="All" active={filter === 'all'} />
        {Object.entries(TYPE_CFG).map(([key, cfg]) => {
          const Icon = cfg.icon
          return (
            <FilterChip
              key={key}
              href={`/admin/pages?type=${key}`}
              label={`${cfg.label}s · ${counts[key as keyof typeof counts]}`}
              active={filter === key}
              icon={<Icon size={11} />}
            />
          )
        })}
      </div>

      {pages.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={32} className="mx-auto mb-3 text-[var(--fg-faint)]" />
          <p className="text-[14px] font-medium mb-1">No pages yet</p>
          <p className="text-[12.5px] text-[var(--fg-dim)] mb-5">Create your first page, blog post, or FAQ entry.</p>
          <Link href="/admin/pages/new" className="btn btn-primary btn-sm inline-flex">
            <Plus size={12} /> New page
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Views</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pages.map(p => {
                const cfg = TYPE_CFG[p.page_type as keyof typeof TYPE_CFG] ?? TYPE_CFG.page
                const Icon = cfg.icon
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {p.featured && <span className="text-[var(--brand)]">★</span>}
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-[11.5px]" style={{ color: `var(--${cfg.tone === 'ok' ? 'ok' : 'brand'})` }}>
                        <Icon size={10} /> {cfg.label}
                      </span>
                    </td>
                    <td><code className="font-mono text-[11.5px] text-[var(--brand)]">{p.slug}</code></td>
                    <td>
                      <Pill tone={p.status === 'published' ? 'ok' : p.status === 'draft' ? 'pend' : 'warn'}>
                        {p.status}
                      </Pill>
                    </td>
                    <td className="tabular-nums text-[12.5px] text-[var(--fg-dim)]">{p.view_count}</td>
                    <td className="text-[11.5px] text-[var(--fg-dim)]">{relativeTime(p.updated_at)}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        {p.status === 'published' && (
                          <Link href={`${cfg.urlPrefix}${p.slug}`} target="_blank" className="text-[11.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1">
                            <ExternalLink size={10} />
                          </Link>
                        )}
                        <Link href={`/admin/pages/${p.id}`} className="text-[11.5px] text-[var(--brand)] hover:underline inline-flex items-center gap-1">
                          <Edit2 size={10} /> Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterChip({ href, label, active, icon }: { href: string; label: string; active: boolean; icon?: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium border transition-colors"
      style={{
        background:  active ? 'var(--brand-faint)' : 'transparent',
        color:       active ? 'var(--brand)' : 'var(--fg-dim)',
        borderColor: active ? 'rgba(59,130,246,0.30)' : 'var(--hairline)',
      }}>
      {icon} {label}
    </Link>
  )
}
