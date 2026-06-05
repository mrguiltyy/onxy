'use client'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DropdownProps {
  trigger:  React.ReactNode
  children: React.ReactNode
  align?:   'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    const onKey   = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown',   onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown',   onKey)
    }
  }, [open])

  return (
    <div ref={wrap} className={cn('relative', className)}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className={cn('absolute top-full mt-1.5 menu z-50', align === 'right' ? 'right-0' : 'left-0')}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DMItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?:    React.ReactNode
  danger?:  boolean
}

export function DropdownItem({ icon, danger, children, className, ...props }: DMItemProps) {
  return (
    <button
      className={cn('menu-item', danger && 'menu-item-danger', className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

export function DropdownSeparator() { return <div className="menu-separator" /> }
