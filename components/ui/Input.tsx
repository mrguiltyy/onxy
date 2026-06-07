import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?:  string
  error?: string
  icon?:  React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-[12px] text-[var(--fg-dim)] font-medium">{label}</label>}
      <div className="relative">
        {icon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-mute)] pointer-events-none"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'input',
            error && '!border-[var(--bad)]',
            className,
          )}
          style={icon ? { paddingLeft: '2.5rem' } : undefined}
          {...props}
        />
      </div>
      {error && <p className="text-[12px] text-[var(--bad)]">{error}</p>}
      {hint && !error && <p className="text-[12px] text-[var(--fg-mute)]">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'
