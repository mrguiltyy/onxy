import { cn } from '@/lib/utils'

type BadgeVariant = 'cyan' | 'purple' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ variant = 'neutral', children, className, dot }: BadgeProps) {
  const v: Record<BadgeVariant, string> = {
    cyan:    'badge badge-cyan',
    purple:  'badge badge-purple',
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger:  'badge badge-danger',
    neutral: 'badge badge-neutral',
  }

  const dotColors: Record<BadgeVariant, string> = {
    cyan:    'bg-[#ff3a00]',
    purple:  'bg-[#ff5b75]',
    success: 'bg-[#5fcb88]',
    warning: 'bg-[#ffae50]',
    danger:  'bg-[#ff5b75]',
    neutral: 'bg-[#71717a]',
  }

  return (
    <span className={cn(v[variant], className)}>
      {dot && <span className={cn('inline-block w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}
