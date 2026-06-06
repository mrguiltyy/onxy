import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600  // re-generate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onxy.cc'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/products`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/reseller`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/status`,   lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.5 },
    { url: `${base}/faq`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${base}/terms`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacy`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/login`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
  ]

  // Dynamic product pages
  const admin = supabaseAdmin()
  const { data: prodsRaw } = await admin
    .from('products')
    .select('slug, updated_at')
    .eq('status', 'active')
    .limit(500)

  const productRoutes: MetadataRoute.Sitemap =
    ((prodsRaw as { slug: string; updated_at: string }[] | null) ?? []).map(p => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  // Published CMS pages (blog / announcements / generic)
  const { data: cmsRaw } = await admin
    .from('cms_pages')
    .select('slug, page_type, updated_at')
    .eq('status', 'published')
    .limit(500)

  const cmsRoutes: MetadataRoute.Sitemap =
    ((cmsRaw as { slug: string; page_type: string; updated_at: string }[] | null) ?? []).map(p => {
      const prefix = p.page_type === 'blog' ? '/blog' : p.page_type === 'faq' ? '/faq' : ''
      return {
        url: `${base}${prefix}/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }
    })

  return [...staticRoutes, ...productRoutes, ...cmsRoutes]
}
