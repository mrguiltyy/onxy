'use client'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'secondary'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  icon?:     React.ReactNode
  iconRight?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, children, className, disabled, ...props }, ref) => {
    const v: Record<Variant, string> = {
      primary:   'btn btn-primary',
      outline:   'btn btn-outline',
      ghost:     'btn btn-ghost',
      danger:    'btn btn-danger',
      secondary: 'btn bg-white/5 border border-white/10 text-white hover:bg-white/10',
    }
    const s: Record<Size, string> = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-primary-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(v[variant], s[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
        {children}
        {!loading && iconRight}
      </button>
    )
  }
)

Button.displayName = 'Button'
