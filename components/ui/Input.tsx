import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
  hint?:    string
  icon?:    React.ReactNode
  suffix?:  React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, suffix, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">{label}</label>
      )}
      <div className="relative flex items-center">
        {icon && <span className="absolute left-3 text-[#6b7280] pointer-events-none flex">{icon}</span>}
        <input
          ref={ref}
          className={cn(
            'input-onyx',
            icon   && 'pl-9',
            suffix && 'pr-12',
            error  && '!border-[#ff5b75] focus:!shadow-[0_0_0_3px_rgba(255,91,117,0.12)]',
            className
          )}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-[#6b7280] text-xs">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-[#ff5b75]">{error}</p>}
      {hint  && !error && <p className="text-xs text-[#6b7280]">{hint}</p>}
    </div>
  )
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?:  string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">{label}</label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'input-onyx resize-none',
          error && '!border-[#ff5b75]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#ff5b75]">{error}</p>}
      {hint  && !error && <p className="text-xs text-[#6b7280]">{hint}</p>}
    </div>
  )
)

Textarea.displayName = 'Textarea'
