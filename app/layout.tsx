import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' })

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onxy.cc'
const SITE_NAME = 'OP'
const DESC      = 'OP — marketplace and auth engine for private tools. Buy lifetime tools with HWID-bound keys, become a reseller and white-label our catalog, or embed our auth.gg-style license API in your own .NET / C++ / Python / Node / Java apps.'
const KEYWORDS  = [
  'resell panel', 'auth.gg alternative', 'keyauth alternative',
  'HWID licensing', 'license key system', 'reseller program',
  'WPF auth', 'C# license validator', 'cheat panel marketplace',
  'private tools', 'cloud licensing', 'software reseller',
  'OP panel', 'onxy', 'lifetime software licenses',
]

export const metadata: Metadata = {
  title:       { default: 'OP — Tools, reseller panels, and auth in one', template: '%s · OP' },
  description: DESC,
  applicationName: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  keywords: KEYWORDS,
  alternates: { canonical: '/' },
  authors: [{ name: 'OP' }],
  creator: 'OP',
  publisher: 'OP',
  category: 'software',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
  openGraph: {
    title:       'OP — Tools, reseller panels, and auth in one',
    description: DESC,
    siteName:    SITE_NAME,
    url:         SITE_URL,
    type:        'website',
    locale:      'en_US',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'OP — Tools & reseller marketplace' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'OP — Tools, reseller panels, and auth in one',
    description: 'Marketplace + auth engine for private tools. Buy lifetime, resell at wholesale, or embed our licensing API.',
    images:      ['/og.png'],
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    // Google site verification token goes here once user generates it
    // google: 'XXXXXXX',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0d14',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Structured data: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/favicon.svg`,
              sameAs: [],
              description: DESC,
            }),
          }}
        />
        {/* Structured data: WebSite (enables sitelinks search box in Google) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
              potentialAction: {
                '@type': 'SearchAction',
                target: `${SITE_URL}/products?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-atmos">
        {children}
      </body>
    </html>
  )
}
