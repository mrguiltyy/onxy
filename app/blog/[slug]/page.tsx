import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin } from '@/lib/supabase/server'
import { md } from '@/lib/markdown'
import { relativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Post {
  id:               string
  slug:             string
  title:            string
  subtitle:         string | null
  body:             string
  published_at:     string | null
  view_count:       number
  meta_title:       string | null
  meta_description: string | null
  meta_keywords:    string[]
  og_image_url:     string | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = supabaseAdmin()
  const { data } = await admin
    .from('cms_pages')
    .select('title, subtitle, meta_title, meta_description, meta_keywords, og_image_url')
    .eq('slug', slug)
    .eq('page_type', 'blog')
    .eq('status', 'published')
    .maybeSingle()
  const p = data as Post | null
  if (!p) return { title: 'Not found' }
  return {
    title:       p.meta_title       ?? p.title,
    description: p.meta_description ?? p.subtitle ?? undefined,
    keywords:    p.meta_keywords?.length ? p.meta_keywords : undefined,
    openGraph: {
      title:       p.meta_title       ?? p.title,
      description: p.meta_description ?? p.subtitle ?? undefined,
      images:      p.og_image_url ? [p.og_image_url] : undefined,
    },
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = supabaseAdmin()
  const { data: pRaw } = await admin
    .from('cms_pages')
    .select('id, slug, title, subtitle, body, published_at, view_count, meta_title, meta_description, meta_keywords, og_image_url')
    .eq('slug', slug)
    .eq('page_type', 'blog')
    .eq('status', 'published')
    .maybeSingle()
  const post = pRaw as Post | null
  if (!post) notFound()

  // Bump view count (best-effort)
  await admin.from('cms_pages').update({ view_count: (post.view_count ?? 0) + 1 } as never).eq('id', post.id)

  return (
    <PublicShell>
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-[var(--fg-dim)] hover:text-[var(--fg)] text-[12.5px] mb-6">
        <ChevronLeft size={13} /> All posts
      </Link>

      <article>
        <p className="label-mono mb-3">Blog</p>
        <h1 className="text-[36px] md:text-[42px] font-bold tracking-tight leading-[1.1] mb-3" style={{ letterSpacing: '-0.025em' }}>
          {post.title}
        </h1>
        {post.subtitle && <p className="text-[16px] text-[var(--fg-dim)] mb-3 leading-relaxed">{post.subtitle}</p>}
        <p className="text-[12px] text-[var(--fg-mute)] mb-10">{post.published_at ? `Published ${relativeTime(post.published_at)}` : ''}</p>

        <div className="prose-cms" dangerouslySetInnerHTML={{ __html: md(post.body) }} />
      </article>
    </PublicShell>
  )
}
