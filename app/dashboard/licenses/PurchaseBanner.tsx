'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Check, X, Sparkles, Copy } from 'lucide-react'

/**
 * Shown when a user lands on /dashboard/licenses?bought=success&session_id=X
 * Confetti-vibes celebration banner with the new key prefix and copy button.
 * Auto-clears the query params from the URL after mount.
 */
export function PurchaseBanner({ recentKey }: { recentKey?: { prefix: string; product: string } | null }) {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const bought = sp.get('bought')
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  // Clean up the query params from the URL after rendering once.
  const clean = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  useEffect(() => {
    if (bought === 'success') {
      setVisible(true)
    }
  }, [bought])

  if (!visible) return null

  async function copy() {
    if (!recentKey?.prefix) return
    await navigator.clipboard.writeText(recentKey.prefix + '-...')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function dismiss() {
    setVisible(false)
    clean()
  }

  return (
    <div
      className="relative rounded-lg p-5 mb-5 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 700px 280px at 20% 0%, rgba(34,197,94,0.10), transparent 60%),' +
          'radial-gradient(ellipse 700px 280px at 100% 100%, rgba(240,164,183,0.10), transparent 60%),' +
          'var(--surface)',
        border: '1px solid rgba(34,197,94,0.25)',
      }}
    >
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 text-[var(--fg-mute)] hover:text-[var(--fg)] transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>

      <div className="flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'var(--ok)', color: '#0a0d14' }}
        >
          <Check size={18} strokeWidth={2.5} />
        </span>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[16px] font-bold tracking-tight">Payment confirmed</h2>
            <Sparkles size={13} className="text-[var(--brand)]" />
          </div>
          <p className="text-[12.5px] text-[var(--fg-dim)] mb-3 leading-relaxed">
            {recentKey
              ? <>Your <strong className="text-[var(--fg)]">{recentKey.product}</strong> key is ready — it&apos;s the top row in the table below.</>
              : <>Your purchase went through and your new key has been added to your licenses.</>}
          </p>

          {recentKey && (
            <div className="flex items-center gap-2 flex-wrap">
              <code
                className="font-mono text-[12.5px] px-3 py-1.5 rounded inline-flex items-center gap-2"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--hairline)',
                  color: 'var(--brand)',
                }}
              >
                {recentKey.prefix}-•••-•••-•••
              </code>
              <button
                onClick={copy}
                className="text-[11.5px] inline-flex items-center gap-1 px-2 py-1.5 rounded transition-colors hover:bg-[var(--surface-2)]"
                style={{ border: '1px solid var(--hairline)', color: 'var(--fg-dim)' }}
              >
                {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy prefix</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
