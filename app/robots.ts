import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onxy.cc'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/products', '/products/*', '/reseller', '/status', '/faq', '/terms', '/privacy'],
        disallow: [
          '/dashboard/*', '/admin/*', '/api/*',
          '/auth/callback', '/auth/signout',
          '/login', '/register',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
