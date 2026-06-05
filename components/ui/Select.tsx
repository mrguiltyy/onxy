'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option { value: string; label: string }

interface SelectProps {
  options:    Option[]
  value:      string
  onChange:   (v: string) => void
  placeholder?: string
  label?:     string
  className?: string
  disabled?:  boolean
}

export function Select({ options, value, onChange, placeholder = 'Select…', label, className, disabled }: SelectProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown',   onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown',   onKey)
    }
  }, [open])

  const current = options.find(o => o.value === value)

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">{label}</label>}

      <div ref={wrapRef} className={cn('relative', className)}>
        <button
          type="button"
          className="select-trigger"
          data-open={open}
          onClick={() => !disabled && setOpen(o => !o)}
          disabled={disabled}
        >
          <span className={current ? 'text-white' : 'text-[#6b7280]'}>
            {current?.label ?? placeholder}
          </span>
          <ChevronDown size={14} className="select-arrow" />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1.5 select-menu z-50">
            {options.map(opt => (
              <div
                key={opt.value}
                className="select-option"
                data-selected={opt.value === value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check size={13} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
