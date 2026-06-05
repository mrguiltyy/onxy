'use client'
import { useState } from 'react'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SecretFieldProps {
  /** The sensitive value (license key, API token, etc.) */
  value: string
  /** Optional label shown above the field */
  label?: string
  /** Optional className for the wrapper */
  className?: string
  /** How many chars to show as a prefix when hidden (default 8 → "ONYX-XXXX") */
  prefixLength?: number
  /** Allow copying the full value to clipboard */
  allowCopy?: boolean
  /** Visual size */
  size?: 'sm' | 'md'
}

/**
 * SecretField — masked sensitive value with eye-toggle reveal.
 *
 * Default state: shows only the prefix and a row of dots.
 * Eye click: reveals the full value for visual confirmation.
 * Copy click: writes the value to the clipboard (always, regardless of reveal state).
 *
 * Use for license keys, session tokens, referral codes, API keys —
 * anything sensitive that lives behind a "click to view" affordance.
 */
export function SecretField({
  value,
  label,
  className,
  prefixLength = 9,        // 'ONYX-XXXX'
  allowCopy = true,
  size = 'md',
}: SecretFieldProps) {

  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied]     = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard unavailable */ }
  }

  // Build the masked representation
  const masked = (() => {
    if (!value) return ''
    const prefix = value.slice(0, prefixLength)
    const tail = value.length - prefixLength
    if (tail <= 0) return value
    // Group dots in 4s with hyphens to match the ONYX-XXXX-XXXX-XXXX-XXXX shape
    const segments = Math.ceil(tail / 5) // 4 dots + hyphen
    return prefix + Array(segments).fill('-••••').join('')
  })()

  const sizing = size === 'sm'
    ? { wrap: 'px-3 py-2', code: 'text-[12px]', icon: 12 }
    : { wrap: 'px-4 py-3', code: 'text-[13.5px]', icon: 13 }

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--fg-mute)]">
          {label}
        </label>
      )}
      <div
        className={cn('flex items-center gap-2 rounded-md', sizing.wrap)}
        style={{
          background: '#050505',
          border: '1px solid var(--hairline-2)',
        }}
      >
        <code
          className={cn('font-mono tracking-wider flex-1 select-all', sizing.code)}
          style={{ color: revealed ? 'var(--c)' : 'var(--fg-mute)', letterSpacing: '0.05em' }}
        >
          {revealed ? value : masked}
        </code>

        <button
          type="button"
          onClick={() => setRevealed(r => !r)}
          aria-label={revealed ? 'Hide value' : 'Reveal value'}
          className="p-1 rounded text-[var(--fg-mute)] hover:text-[var(--fg)] transition-colors shrink-0"
        >
          {revealed ? <EyeOff size={sizing.icon} /> : <Eye size={sizing.icon} />}
        </button>

        {allowCopy && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy to clipboard"
            className="p-1 rounded text-[var(--fg-mute)] hover:text-[var(--c)] transition-colors shrink-0"
          >
            {copied ? <Check size={sizing.icon} className="text-[var(--ok)]" /> : <Copy size={sizing.icon} />}
          </button>
        )}
      </div>
    </div>
  )
}
