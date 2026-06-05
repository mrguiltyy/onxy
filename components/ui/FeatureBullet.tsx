import { cn } from '@/lib/utils'

type Tone = 'cyan' | 'success' | 'warn' | 'danger' | 'info' | 'mute'

interface FeatureBulletProps {
  icon:   React.ReactNode
  tone?:  Tone
  size?:  'sm' | 'md'
  children: React.ReactNode
  className?: string
}

/**
 * FeatureBullet — replaces inline emoji bullets with a themed icon chip.
 *
 * Renders an icon inside a small colored pill aligned with text.
 * Used in trust strips, fine print, summaries, etc.
 */
export function FeatureBullet({ icon, tone = 'cyan', size = 'sm', children, className }: FeatureBulletProps) {
  const tones: Record<Tone, { bg: string; bd: string; fg: string }> = {
    cyan:    { bg: 'rgba(255, 58, 0, 0.10)',  bd: 'rgba(255, 58, 0, 0.20)',  fg: '#ff3a00' },
    success: { bg: 'rgba(95, 203, 136, 0.10)',   bd: 'rgba(95, 203, 136, 0.20)',   fg: '#5fcb88' },
    warn:    { bg: 'rgba(255, 174, 80, 0.10)',  bd: 'rgba(255, 174, 80, 0.20)',  fg: '#ffae50' },
    danger:  { bg: 'rgba(255, 91, 117, 0.10)',   bd: 'rgba(255, 91, 117, 0.20)',   fg: '#ff5b75' },
    info:    { bg: 'rgba(91, 141, 239, 0.10)',  bd: 'rgba(91, 141, 239, 0.20)',  fg: '#5b8def' },
    mute:    { bg: 'rgba(255, 255, 255, 0.04)', bd: 'rgba(255, 255, 255, 0.08)', fg: '#9ca3af' },
  }
  const t = tones[tone]
  const dimensions = size === 'sm' ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]'

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn('inline-flex items-center justify-center rounded-[5px] shrink-0', dimensions)}
        style={{ background: t.bg, border: `1px solid ${t.bd}`, color: t.fg }}
      >
        {icon}
      </span>
      <span className="text-[12.5px] text-[#9ca3af] leading-snug">{children}</span>
    </div>
  )
}

/**
 * IconBadge — for inline "✓ / ✗" style indicators inside text values.
 */
export function IconBadge({ icon, tone = 'cyan', label }: { icon: React.ReactNode; tone?: Tone; label?: string }) {
  const tones: Record<Tone, string> = {
    cyan:    '#ff3a00', success: '#5fcb88', warn: '#ffae50',
    danger:  '#ff5b75', info:    '#5b8def', mute: '#9ca3af',
  }
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: tones[tone] }}>
      {icon}
      {label && <span>{label}</span>}
    </span>
  )
}
