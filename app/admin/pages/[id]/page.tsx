import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { PageEditor } from '../PageEditor'

export const metadata = { title: 'Edit page · Admin' }
export const dynamic = 'force-dynamic'

interface CmsRow {
  id:               string
  slug:             string
  page_type:        string
  title:            string
  subtitle:         string | null
  body:             string
  status:           string
  featured:         boolean
  meta_title:       string | null
  meta_description: string | null
  meta_keywords:    string[]
  og_image_url:     string | null
}

const URL_PREFIX: Record<string, string> = {
  page: '/', faq: '/faq/', blog: '/blog/', announcement: '/announcements/', giveaway: '/giveaways/',
}

export default async function EditCmsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = supabaseAdmin()
  const { data } = await admin.from('cms_pages').select('*').eq('id', id).maybeSingle()
  const page = data as CmsRow | null
  if (!page) notFound()

  return (
    <div className="max-w-[1100px]">
      <Link href="/admin/pages" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 mb-4">
        <ChevronLeft size={13} /> All pages
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="label-mono mb-2">{page.page_type}</p>
          <h1 className="text-[24px] font-bold tracking-tight">{page.title}</h1>
          <p className="text-[12.5px] text-[var(--fg-dim)] font-mono mt-1">
            slug: <span className="text-[var(--brand)]">{page.slug}</span>
          </p>
        </div>
        {page.status === 'published' && (
          <Link href={`${URL_PREFIX[page.page_type] ?? '/'}${page.slug}`} target="_blank" className="btn btn-secondary btn-sm">
            <ExternalLink size={11} /> Public page
          </Link>
        )}
      </div>

      <PageEditor initial={page} />
    </div>
  )
}
