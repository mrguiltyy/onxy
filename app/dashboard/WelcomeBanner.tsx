'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Check, Sparkles, ArrowRight } from 'lucide-react'

interface Props {
  username:        string
  discordLinked:   boolean
  hasLicense:      boolean
  onboardingDone:  boolean
}

const DISMISS_KEY = 'op_welcome_dismissed'

export function WelcomeBanner({ username, discordLinked, hasLicense, onboardingDone }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  // Hide entirely once all 3 boxes are checked
  const allDone = discordLinked && hasLicense && onboardingDone

  if (!mounted || dismissed || allDone) return null

  function dismiss() {
    setDismissed(true)
    if (typeof window !== 'undefined') localStorage.setItem(DISMISS_KEY, '1')
  }

  return (
    <div
      className="rounded-lg p-5 mb-5 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 500px 200px at 0% 0%, rgba(240,164,183,0.12), transparent 60%),' +
          'radial-gradient(ellipse 500px 200px at 100% 100%, rgba(162,200,238,0.12), transparent 60%),' +
          'var(--surface)',
        border: '1px solid var(--hairline)',
      }}
    >
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 text-[var(--fg-mute)] hover:text-[var(--fg)] transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>

      <div className="flex items-start gap-3 mb-4">
        <span className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{
          background: 'var(--brand-gradient)', color: '#3a2630',
        }}>
          <Sparkles size={14} />
        </span>
        <div>
          <h2 className="text-[15.5px] font-bold tracking-tight">Welcome to OP, {username}</h2>
          <p className="text-[12.5px] text-[var(--fg-dim)] mt-0.5">Three quick steps to get the most from your account.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Step
          done={onboardingDone}
          number={1}
          title="Complete onboarding"
          body="Profile photo + bio"
          cta="Continue setup"
          ctaHref="/onboarding?skip=0"
        />
        <Step
          done={discordLinked}
          number={2}
          title="Link Discord"
          body="Get $1 wallet credit"
          cta="Link Discord"
          ctaHref="/dashboard/account"
        />
        <Step
          done={hasLicense}
          number={3}
          title="Get your first key"
          body="Browse the catalog"
          cta="Browse products"
          ctaHref="/products"
        />
      </div>
    </div>
  )
}

function Step({ done, number, title, body, cta, ctaHref }: { done: boolean; number: number; title: string; body: string; cta: string; ctaHref: string }) {
  return (
    <div
      className="rounded-md p-4"
      style={{
        background: done ? 'rgba(34,197,94,0.04)' : 'var(--surface-2)',
        border:     `1px solid ${done ? 'rgba(34,197,94,0.20)' : 'var(--hairline)'}`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
          style={{
            background: done ? 'var(--ok)' : 'var(--surface)',
            color:      done ? '#0a0d14' : 'var(--fg-mute)',
            border:     done ? 'none' : '1px solid var(--hairline)',
          }}
        >
          {done ? <Check size={11} /> : number}
        </span>
      </div>
      <p className={`text-[13px] font-semibold ${done ? 'text-[var(--ok)] line-through opacity-70' : ''}`}>{title}</p>
      <p className="text-[11.5px] text-[var(--fg-mute)] mt-0.5">{body}</p>
      {!done && (
        <Link href={ctaHref} className="text-[11.5px] text-[var(--brand)] hover:underline inline-flex items-center gap-1 mt-3">
          {cta} <ArrowRight size={10} />
        </Link>
      )}
    </div>
  )
}
