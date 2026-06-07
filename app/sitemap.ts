import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const URL_PREFIX: Record<string, string> = {
  page:         '/',
  blog:         '/blog/',
  faq:          '/faq/',
  announcement: '/announcements/',
  giveaway:     '/giveaways/',
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onxy.cc').replace(/\/$/, '')
  const admin = supabaseAdmin()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/products`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/reseller`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/rebrand`,  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/blog`,     lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/faq`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/status`,   lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.5 },
    { url: `${base}/terms`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacy`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/login`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.6 },
  ]

  // ── Dynamic product pages ──
  const { data: prodsRaw } = await admin
    .from('products')
    .select('slug, updated_at')
    .eq('status', 'active')
    .limit(1000)
  const productRoutes: MetadataRoute.Sitemap =
    ((prodsRaw as { slug: string; updated_at: string }[] | null) ?? []).map(p => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  // ── Dynamic CMS pages (blog, FAQ entries, announcements, etc) ──
  let cmsRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: cmsRaw } = await admin
      .from('cms_pages')
      .select('slug, page_type, updated_at, view_count, featured')
      .eq('status', 'published')
      .limit(1000)
    cmsRoutes =
      ((cmsRaw as { slug: string; page_type: string; updated_at: string; view_count: number; featured: boolean }[] | null) ?? [])
        .map(p => {
          const prefix = URL_PREFIX[p.page_type] ?? '/'
          // Featured posts get higher priority; high-view posts get a small boost
          const priority = p.featured ? 0.8 : Math.min(0.7, 0.5 + (p.view_count > 0 ? 0.1 : 0))
          return {
            url: `${base}${prefix}${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority,
          }
        })
  } catch { /* cms_pages table not yet created */ }

  // ── Public user profiles (if profile_public = true) ──
  let profileRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: profsRaw } = await admin
      .from('profiles')
      .select('username, created_at, profile_public')
      .eq('profile_public', true)
      .limit(5000)
    profileRoutes =
      ((profsRaw as { username: string; created_at: string }[] | null) ?? []).map(p => ({
        url: `${base}/u/${p.username}`,
        lastModified: p.created_at ? new Date(p.created_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.3,
      }))
  } catch { /* profile_public column not yet added */ }

  return [...staticRoutes, ...productRoutes, ...cmsRoutes, ...profileRoutes]
}
