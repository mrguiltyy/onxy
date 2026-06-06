import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title:       { default: 'OP Panel — #1 Seller for cheap resell panels', template: '%s · OP' },
  description: '#1 seller for cheap resell panels. Generate keys, manage your wallet, top up instantly.',
  applicationName: 'OP',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://onxy.cc'),
  openGraph: {
    title:       'OP — #1 Seller for cheap resell panels',
    description: 'Generate keys, manage your wallet, top up instantly.',
    siteName:    'OP',
    type:        'website',
  },
  themeColor: '#0a0d14',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased bg-atmos">
        {children}
      </body>
    </html>
  )
}
