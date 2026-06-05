import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import { SmoothScroll } from '@/components/providers/SmoothScroll'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

const geistSans  = Geist({       variable: '--font-geist-sans', subsets: ['latin'], display: 'swap' })
const geistMono  = Geist_Mono({  variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' })
const serif      = Instrument_Serif({
  variable:    '--font-serif',
  weight:      '400',
  style:       ['normal', 'italic'],
  subsets:     ['latin'],
  display:     'swap',
})

export const metadata: Metadata = {
  title:       { default: 'Onyx Services', template: '%s | Onyx Services' },
  description: 'Premium private software tools. Hardware-locked, auto-updating, instant delivery.',
  metadataBase: new URL('https://onyx.gg'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${serif.variable}`}>
      <body className="min-h-screen antialiased bg-grain">
        <ToastProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </ToastProvider>
      </body>
    </html>
  )
}
