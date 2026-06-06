'use client'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'icon'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  icon?:     React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    const v: Record<Variant, string> = {
      primary: 'btn btn-primary',
      outline: 'btn btn-outline',
      ghost:   'btn btn-ghost',
      danger:  'btn btn-danger',
      icon:    'btn btn-icon',
    }
    const s: Record<Size, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' }

    return (
      <button
        ref={ref}
        className={cn(v[variant], s[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
