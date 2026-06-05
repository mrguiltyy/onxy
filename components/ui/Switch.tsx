'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  description?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, className, ...props }, ref) => (
    <label className={cn('swtch', className)}>
      <input ref={ref} type="checkbox" className="swtch-input" {...props} />
      <span className="swtch-track" />
      {(label || description) && (
        <div className="flex flex-col">
          {label       && <span className="text-white font-medium text-[14px]">{label}</span>}
          {description && <span className="text-[#9ca3af] text-[12.5px] mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  )
)

Switch.displayName = 'Switch'
