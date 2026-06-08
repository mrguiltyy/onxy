'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, X, Sparkles, ChevronLeft } from 'lucide-react'

const STORAGE_KEY = 'op_tour_done_v1'

interface Step {
  selector:    string                   // CSS selector for the element to spotlight
  title:       string
  body:        string
  position?:   'top' | 'bottom' | 'left' | 'right' | 'center'
  optional?:   boolean                  // skip if element not found
}

const STEPS: Step[] = [
  {
    selector: 'header',
    title:    'Welcome to OP',
    body:     "We'll walk you through the dashboard in 6 quick steps. You can skip at any time.",
    position: 'center',
  },
  {
    selector: 'a[href="/dashboard/balance"], a[href*="balance"]',
    title:    'Your wallet',
    body:     'Top up here with card or crypto. Every purchase across the platform deducts from your wallet.',
    position: 'bottom',
    optional: true,
  },
  {
    selector: 'a[href="/products"], a[href*="generate"]',
    title:    'Get tools',
    body:     'Browse the catalog and pick up keys, or generate them from the dashboard if you already have a license code.',
    position: 'bottom',
    optional: true,
  },
  {
    selector: 'a[href*="account"]',
    title:    'Account settings',
    body:     'Edit your profile picture, link Discord (gets you $1 credit), enable 2FA, and sign out — all from your account page.',
    position: 'bottom',
    optional: true,
  },
  {
    selector: '[aria-label="Get help"], [aria-label*="help"]',
    title:    'Need help?',
    body:     'The pink ribbon button in the bottom-right is always there. Click for the troubleshooter, FAQ, or to open a ticket.',
    position: 'left',
    optional: true,
  },
  {
    selector: 'a[href*="reseller"]',
    title:    "You're ready",
    body:     'Want to resell our tools? Hit Reseller in the nav and pick the tools you want to sell. $15 base + $5 per extra tool.',
    position: 'bottom',
    optional: true,
  },
]

export function GuidedTour({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Auto-start on mount if not previously dismissed
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    const done = localStorage.getItem(STORAGE_KEY) === '1'
    if (!done) {
      // wait a tick for layout to settle
      const t = setTimeout(() => setRunning(true), 800)
      return () => clearTimeout(t)
    }
  }, [enabled])

  const measure = useCallback(() => {
    const current = STEPS[step]
    if (!current) return
    if (current.position === 'center') { setRect(null); return }
    const el = document.querySelector(current.selector) as HTMLElement | null
    if (!el) {
      if (current.optional) { advance(); return }
      setRect(null)
      return
    }
    const r = el.getBoundingClientRect()
    setRect(r)
    // Scroll element into view if it's not visible
    if (r.top < 0 || r.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        const r2 = el.getBoundingClientRect()
        setRect(r2)
      }, 350)
    }
  }, [step])    // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running) return
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [running, step, measure])

  function advance() {
    if (step + 1 >= STEPS.length) {
      finish()
    } else {
      setStep(s => s + 1)
    }
  }

  function back() {
    setStep(s => Math.max(0, s - 1))
  }

  function finish() {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, '1')
    setRunning(false)
  }

  function skip() {
    finish()
  }

  if (!running) return null
  const current = STEPS[step]
  if (!current) return null

  // Position tooltip
  let tipStyle: React.CSSProperties = {}
  const TIP_W = 360
  const PAD = 16
  if (current.position === 'center' || !rect) {
    tipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: TIP_W,
    }
  } else {
    const pos = current.position ?? 'bottom'
    let top = 0; let left = 0
    if (pos === 'bottom') {
      top  = rect.bottom + PAD
      left = Math.max(PAD, Math.min(window.innerWidth - TIP_W - PAD, rect.left + rect.width / 2 - TIP_W / 2))
    } else if (pos === 'top') {
      top  = Math.max(PAD, rect.top - PAD - 180)
      left = Math.max(PAD, Math.min(window.innerWidth - TIP_W - PAD, rect.left + rect.width / 2 - TIP_W / 2))
    } else if (pos === 'left') {
      top  = Math.max(PAD, rect.top + rect.height / 2 - 90)
      left = Math.max(PAD, rect.left - TIP_W - PAD)
    } else {
      top  = Math.max(PAD, rect.top + rect.height / 2 - 90)
      left = Math.min(window.innerWidth - TIP_W - PAD, rect.right + PAD)
    }
    tipStyle = {
      position: 'fixed',
      top:  Math.min(window.innerHeight - 200 - PAD, top),
      left,
      width: TIP_W,
    }
  }

  // Spotlight cutout — using a giant box-shadow trick
  const spotlightStyle: React.CSSProperties = rect && current.position !== 'center'
    ? {
        position:  'fixed',
        top:       rect.top - 8,
        left:      rect.left - 8,
        width:     rect.width + 16,
        height:    rect.height + 16,
        borderRadius: 12,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
        border:    '2px solid var(--brand)',
        pointerEvents: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    : {
        position:  'fixed',
        inset:     0,
        background: 'rgba(0,0,0,0.72)',
        pointerEvents: 'none',
      }

  return (
    <>
      <div style={spotlightStyle} />

      <div
        ref={ref}
        className="rounded-md p-5 z-[10000]"
        style={{
          ...tipStyle,
          background: 'var(--surface)',
          border: '1px solid var(--hairline)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,164,183,0.15)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-[var(--brand)]" />
            <p className="label-mono">
              Tour · {step + 1}/{STEPS.length}
            </p>
          </div>
          <button onClick={skip} className="text-[11px] text-[var(--fg-mute)] hover:text-[var(--fg)] inline-flex items-center gap-1">
            Skip <X size={11} />
          </button>
        </div>

        <h3 className="text-[16px] font-bold tracking-tight mb-1.5">{current.title}</h3>
        <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed mb-4">{current.body}</p>

        {/* Progress bar */}
        <div className="h-[3px] rounded-full overflow-hidden mb-4" style={{ background: 'var(--surface-2)' }}>
          <div
            className="h-full transition-all"
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, var(--brand), var(--ok))',
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 disabled:opacity-30"
          >
            <ChevronLeft size={12} /> Back
          </button>
          <button onClick={advance} className="btn btn-primary btn-sm">
            {step + 1 >= STEPS.length ? "I'm done" : 'Next'} <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </>
  )
}
