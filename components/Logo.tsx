import Link from 'next/link'

interface Props {
  size?:      'sm' | 'md' | 'lg'
  href?:      string
  showLabel?: boolean
}

/**
 * Modern OP logo — gradient diamond mark + clean wordmark.
 *
 * - size sm:  for header (28px mark, 16px text)
 * - size md:  for hero (40px mark, 22px text)
 * - size lg:  for hero ATF (60px mark, 32px text)
 */
export function Logo({ size = 'sm', href = '/', showLabel = true }: Props) {
  const dims = {
    sm: { mark: 28, gap: 10, text: 16, sub: 10 },
    md: { mark: 40, gap: 12, text: 22, sub: 11 },
    lg: { mark: 60, gap: 16, text: 32, sub: 13 },
  }[size]

  const inner = (
    <span className="inline-flex items-center" style={{ gap: dims.gap }}>
      {/* Diamond mark */}
      <LogoMark size={dims.mark} />

      {showLabel && (
        <span className="inline-flex flex-col leading-none">
          <span
            className="font-black tracking-tight"
            style={{
              fontSize:        dims.text,
              fontFamily:      'var(--font-geist-sans), Inter, system-ui, sans-serif',
              letterSpacing:   '-0.04em',
              backgroundImage: 'linear-gradient(135deg, #f0a4b7 0%, #c5b3df 50%, #a2c8ee 100%)',
              backgroundClip:  'text',
              WebkitBackgroundClip: 'text',
              color:           'transparent',
              WebkitTextFillColor: 'transparent',
            }}
          >
            OP
          </span>
          {size !== 'sm' || true ? (
            <span
              className="font-medium tracking-[0.18em] uppercase mt-1"
              style={{
                fontSize: dims.sub,
                color: 'var(--fg-mute)',
              }}
            >
              Panel
            </span>
          ) : null}
        </span>
      )}
    </span>
  )

  return href ? (
    <Link href={href} className="inline-flex transition-opacity hover:opacity-90">
      {inner}
    </Link>
  ) : inner
}

function LogoMark({ size }: { size: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg relative overflow-hidden shrink-0"
      style={{
        width:      size,
        height:     size,
        background:
          'linear-gradient(135deg, #f0a4b7 0%, #c5b3df 50%, #a2c8ee 100%)',
        boxShadow:  '0 4px 16px rgba(240,164,183,0.28), inset 0 0 0 1px rgba(255,255,255,0.18)',
      }}
    >
      {/* Inner diamond letter */}
      <svg
        viewBox="0 0 24 24"
        width={Math.floor(size * 0.62)}
        height={Math.floor(size * 0.62)}
        fill="none"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(58,38,48,0.30))',
        }}
      >
        <path
          d="M12 3 L20 9 L20 17 L12 21 L4 17 L4 9 Z"
          fill="rgba(58,38,48,0.15)"
          stroke="#3a2630"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M10 9 L10 16 M10 9 L13.5 9 Q15 9 15 10.5 Q15 12 13.5 12 L10 12"
          fill="none"
          stroke="#3a2630"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Subtle inner shine */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.20) 0%, transparent 50%)',
          borderRadius: 'inherit',
        }}
      />
    </span>
  )
}

/** Just the mark, no wordmark — useful for favicons / mobile / footers. */
export function LogoMarkOnly({ size = 28 }: { size?: number }) {
  return <LogoMark size={size} />
}
