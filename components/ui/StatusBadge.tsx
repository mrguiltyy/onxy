import { cn } from '@/lib/utils'

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'cyan' | 'mute'

interface StatusBadgeProps {
  tone?:     Tone
  children:  React.ReactNode
  dot?:      boolean
  className?: string
}

export function StatusBadge({ tone = 'mute', children, dot = true, className }: StatusBadgeProps) {
  return (
    <span className={cn(`status status-${tone}`, className)}>
      {dot && <span className="status-dot" />}
      {children}
    </span>
  )
}

interface PriceChipProps {
  amount:  number   // cents
  period?: string
  className?: string
}

export function PriceChip({ amount, period = '/mo', className }: PriceChipProps) {
  return (
    <span className={cn('price-chip', className)}>
      <span className="price-chip-amount">${(amount / 100).toFixed(2)}</span>
      <span className="price-chip-period">{period}</span>
    </span>
  )
}
