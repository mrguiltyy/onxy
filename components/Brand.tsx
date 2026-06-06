import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandProps {
  size?: 'sm' | 'md' | 'lg'
  href?: string
  withStatus?: boolean
  className?: string
}

/**
 * Brand mark — the canonical Onyx logo + wordmark.
 *
 * Used in the topbar, auth pages, footers, error pages.
 * The hex-cut "O" tile is the visual signature.
 */
export function Brand({ size = 'md', href = '/', withStatus = false, className }: BrandProps) {
  const sz = {
    sm: { tile: 'w-7 h-7 text-[12px]',  word: 'text-[13px]', sub: 'text-[9px]'  },
    md: { tile: 'w-8 h-8 text-[14px]',  word: 'text-[14px]', sub: 'text-[10px]' },
    lg: { tile: 'w-10 h-10 text-[16px]',word: 'text-[16px]', sub: 'text-[11px]' },
  }[size]

  const inner = (
    <div className={cn('flex items-center gap-2.5 group', className)}>
      <span
        className={cn('relative rounded-md flex items-center justify-center text-white font-bold shrink-0', sz.tile)}
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)',
          boxShadow:  '0 0 0 1px rgba(59,130,246,0.35), 0 4px 14px rgba(59,130,246,0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
      >
        O
        {/* hex-cut corner notch — the brand signature */}
        <span
          className="absolute -top-px -right-px w-2 h-2 pointer-events-none"
          style={{
            background: 'var(--bg)',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
            borderTopRightRadius: '6px',
          }}
        />
      </span>

      <div className="flex flex-col leading-none">
        <span className={cn('font-bold tracking-tight text-[var(--fg)]', sz.word)}>
          Onyx
        </span>
        <span className={cn('text-[var(--fg-mute)] tracking-[0.18em] uppercase mt-1', sz.sub)}>
          Panel
        </span>
      </div>

      {withStatus && (
        <span className="hidden md:inline-flex pill pill-ok ml-1">
          <span className="dot dot-ok" /> Online
        </span>
      )}
    </div>
  )

  return href ? <Link href={href} className="inline-flex">{inner}</Link> : inner
}
