'use client'
import { useEffect } from 'react'

/**
 * AntiInspect — deterrent against casual snooping.
 *
 * Blocks:
 *   • F12                            — open devtools
 *   • Ctrl+Shift+I / J / C / K       — open devtools
 *   • Ctrl+U                          — view page source
 *   • Ctrl+S                          — save page
 *   • Right-click context menu
 *   • Cmd equivalents on macOS
 *
 * Notes:
 *   - This is security-by-friction, not real security.
 *     Determined users can bypass via proxy, browser flags, or disabled JS.
 *   - Mount only inside authenticated areas (dashboard, admin).
 *     Don't apply to /login, /register, /faq, /terms — those need to be
 *     freely inspectable so users trust the site.
 */
export function AntiInspect({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return

    const blockedKey = (e: KeyboardEvent): boolean => {
      const key = e.key.toUpperCase()
      const mod = e.ctrlKey || e.metaKey
      const shift = e.shiftKey

      // F12 — open devtools
      if (key === 'F12') return true

      // Ctrl/Cmd + Shift + I/J/C/K — devtools shortcuts
      if (mod && shift && ['I', 'J', 'C', 'K'].includes(key)) return true

      // Ctrl/Cmd + U — view source
      if (mod && !shift && key === 'U') return true

      // Ctrl/Cmd + S — save page
      if (mod && !shift && key === 'S') return true

      return false
    }

    const onKey = (e: KeyboardEvent) => {
      if (blockedKey(e)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const onContext = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    // Block drag-selection of text on protected pages (also makes screenshots harder)
    const onDragStart = (e: DragEvent) => {
      e.preventDefault()
    }

    document.addEventListener('keydown',     onKey,      { capture: true })
    document.addEventListener('contextmenu', onContext,  { capture: true })
    document.addEventListener('dragstart',   onDragStart,{ capture: true })

    return () => {
      document.removeEventListener('keydown',     onKey,      { capture: true })
      document.removeEventListener('contextmenu', onContext,  { capture: true })
      document.removeEventListener('dragstart',   onDragStart,{ capture: true })
    }
  }, [enabled])

  return null
}
