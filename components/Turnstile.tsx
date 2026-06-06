'use client'
import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile widget — invisible / managed captcha alternative.
 *
 * Set NEXT_PUBLIC_TURNSTILE_SITE_KEY to your site key.
 * If not configured, renders nothing (bypassed).
 *
 * Get your keys at: https://dash.cloudflare.com/?to=/:account/turnstile
 */
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, opts: {
        sitekey:   string
        callback?: (token: string) => void
        'error-callback'?:   () => void
        'expired-callback'?: () => void
        theme?:    'light' | 'dark' | 'auto'
        size?:     'normal' | 'compact' | 'invisible'
        appearance?: 'always' | 'execute' | 'interaction-only'
      }) => string
      reset:    (id?: string) => void
      remove:   (id?: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export function Turnstile({ onToken, theme = 'dark' }: { onToken: (token: string | null) => void; theme?: 'light' | 'dark' | 'auto' }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef  = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY) return

    function render() {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey:  SITE_KEY,
        theme,
        callback: (token) => onToken(token),
        'error-callback':   () => onToken(null),
        'expired-callback': () => onToken(null),
      })
    }

    if (window.turnstile) {
      render()
    } else {
      const existing = document.querySelector('script[data-turnstile]')
      if (!existing) {
        const s = document.createElement('script')
        s.src   = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit'
        s.async = true
        s.defer = true
        s.setAttribute('data-turnstile', '1')
        document.head.appendChild(s)
      }
      window.onTurnstileLoad = render
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch {}
        widgetIdRef.current = null
      }
    }
  }, [onToken, theme])

  if (!SITE_KEY) return null

  return <div ref={containerRef} className="cf-turnstile mt-2 flex justify-center" />
}

export function isTurnstileConfigured(): boolean {
  return !!SITE_KEY
}
