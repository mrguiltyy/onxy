import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin } from '@/lib/supabase/server'
import { relativeTime } from '@/lib/utils'

export const metadata = {
  title: 'Blog · OP',
  description: 'Updates, guides, and launch notes from OP.',
}
export const dynamic = 'force-dynamic'

interface Post {
  slug: string; title: string; subtitle: string | null; published_at: string | null; updated_at: string; featured: boolean
}

export default async function BlogIndex() {
  const admin = supabaseAdmin()
  const { data: postsRaw } = await admin
    .from('cms_pages')
    .select('slug, title, subtitle, published_at, updated_at, featured')
    .eq('page_type', 'blog')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(50)
  const posts = (postsRaw as Post[] | null) ?? []

  return (
    <PublicShell wide>
      <div className="mb-12">
        <p className="label-mono mb-2">Blog</p>
        <h1 className="text-[36px] font-bold tracking-tight" style={{ letterSpacing: '-0.025em' }}>What&apos;s new at OP</h1>
        <p className="text-[14px] text-[var(--fg-dim)] mt-2">Releases, guides, and the occasional rant.</p>
      </div>

      {posts.length === 0 ? (
        <div className="card p-16 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-[var(--fg-faint)]" />
          <p className="text-[14px] text-[var(--fg-dim)]">No posts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(p => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="card card-hover p-6 flex flex-col group">
              {p.featured && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-3 inline-flex w-fit"
                style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>★ Featured</span>}
              <h2 className="text-[18px] font-bold tracking-tight mb-2 group-hover:text-[var(--brand)] transition-colors">{p.title}</h2>
              {p.subtitle && <p className="text-[13px] text-[var(--fg-dim)] line-clamp-2 leading-relaxed flex-1 mb-3">{p.subtitle}</p>}
              <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: 'var(--hairline)' }}>
                <span className="text-[11.5px] text-[var(--fg-mute)]">{p.published_at ? relativeTime(p.published_at) : ''}</span>
                <span className="text-[12px] text-[var(--brand)] inline-flex items-center gap-1 group-hover:gap-2 transition-all">Read <ArrowRight size={10} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PublicShell>
  )
}
