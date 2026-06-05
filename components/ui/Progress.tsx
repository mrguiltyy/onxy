import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number   // 0–100
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn('progress', className)}>
      <div className="progress-fill" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  )
}
