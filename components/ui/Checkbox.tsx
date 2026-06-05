'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => (
    <label className={cn('cbx', className)}>
      <input ref={ref} type="checkbox" className="cbx-input" {...props} />
      <span className="cbx-box" />
      {label && <span>{label}</span>}
    </label>
  )
)

Checkbox.displayName = 'Checkbox'
