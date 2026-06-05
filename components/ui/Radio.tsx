'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className, ...props }, ref) => (
    <label className={cn('rdo', className)}>
      <input ref={ref} type="radio" className="rdo-input" {...props} />
      <span className="rdo-box" />
      {label && <span>{label}</span>}
    </label>
  )
)

Radio.displayName = 'Radio'

export function RadioGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-2', className)}>{children}</div>
}
