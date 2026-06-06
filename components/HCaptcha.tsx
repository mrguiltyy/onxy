'use client'
import { useEffect, useRef } from 'react'

/**
 * Lightweight hCaptcha wrapper. No npm dep needed — loads the script directly.
 *
 * Set NEXT_PUBLIC_HCAPTCHA_SITE_KEY to your site key.
 * If not configured, this renders nothing (captcha is bypassed in dev).
 */
declare global {
  interface Window {
    hcaptcha?: {
      render: (container: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void; theme?: string }) => string
      reset:  (id?: string) => void
    }
    onHCaptchaLoad?: () => void
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? ''

export function HCaptcha({ onToken }: { onToken: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef  = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY) return

    function render() {
      if (!window.hcaptcha || !containerRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme:   'dark',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(null),
      })
    }

    if (window.hcaptcha) {
      render()
    } else {
      // Inject script
      const existing = document.querySelector('script[data-hcaptcha]')
      if (!existing) {
        const s = document.createElement('script')
        s.src = 'https://hcaptcha.com/1/api.js?onload=onHCaptchaLoad&render=explicit'
        s.async = true
        s.defer = true
        s.setAttribute('data-hcaptcha', '1')
        document.head.appendChild(s)
      }
      window.onHCaptchaLoad = render
    }
  }, [onToken])

  if (!SITE_KEY) return null

  return <div ref={containerRef} className="h-captcha mt-2" />
}

export function isCaptchaConfigured(): boolean {
  return !!SITE_KEY
}
