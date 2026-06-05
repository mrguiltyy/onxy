'use client'
import { cn } from '@/lib/utils'

export function Tooltip({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('tip-wrap', className)}>
      {children}
      <span className="tip-body">{label}</span>
    </span>
  )
}
