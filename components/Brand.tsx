import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandProps {
  size?:    'sm' | 'md' | 'lg' | 'xl'
  href?:    string
  tagline?: boolean
  className?: string
}

/**
 * OP brand wordmark — pink-to-blue gradient on the "OP" letters.
 * Optional tagline beneath.
 */
export function Brand({ size = 'md', href = '/', tagline = false, className }: BrandProps) {
  const sz = {
    sm: { word: 36, sub: 10 },
    md: { word: 44, sub: 11 },
    lg: { word: 64, sub: 12 },
    xl: { word: 84, sub: 13 },
  }[size]

  const inner = (
    <div className={cn('inline-flex flex-col items-center gap-1', className)}>
      <span
        className="font-black leading-none"
        style={{
          fontSize:        sz.word,
          fontFamily:      'var(--font-geist-sans), Inter, system-ui, sans-serif',
          letterSpacing:   '-0.03em',
          backgroundImage: 'linear-gradient(135deg, #f0a4b7 0%, #c5b3df 50%, #a2c8ee 100%)',
          backgroundClip:  'text',
          WebkitBackgroundClip: 'text',
          color:           'transparent',
          WebkitTextFillColor: 'transparent',
        }}
      >
        OP
      </span>
      {tagline && (
        <p
          className="font-medium text-center mt-2"
          style={{ fontSize: sz.sub, color: 'var(--fg-dim)', letterSpacing: '0.01em' }}
        >
          #1 Seller for cheap resell panels
        </p>
      )}
    </div>
  )

  return href ? <Link href={href} className="inline-flex">{inner}</Link> : inner
}

/**
 * BrandRow — horizontal mark for navbars (small "OP" letters inline).
 */
export function BrandRow({ href = '/', className }: { href?: string; className?: string }) {
  const inner = (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span
        className="font-black leading-none"
        style={{
          fontSize:        22,
          fontFamily:      'var(--font-geist-sans), Inter, system-ui, sans-serif',
          letterSpacing:   '-0.05em',
          backgroundImage: 'linear-gradient(135deg, #f0a4b7 0%, #c5b3df 50%, #a2c8ee 100%)',
          backgroundClip:  'text',
          WebkitBackgroundClip: 'text',
          color:           'transparent',
          WebkitTextFillColor: 'transparent',
        }}
      >
        OP
      </span>
      <span className="font-mono text-[10.5px] uppercase tracking-[0.2em]" style={{ color: 'var(--fg-mute)' }}>
        Panel
      </span>
    </span>
  )
  return href ? <Link href={href} className="inline-flex">{inner}</Link> : inner
}
