'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { LifeBuoy, MessageSquare, Activity, BookOpen, X } from 'lucide-react'

/**
 * Floating "Get help" button — bottom-right corner of every dashboard page.
 * Single click → expands a small panel with shortcuts to troubleshooter, ticket, FAQ.
 */
export function HelpBubble() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-40">
      {open && (
        <div
          className="mb-2 rounded-md overflow-hidden w-[280px] shadow-2xl"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--hairline)' }}>
            <p className="font-semibold text-[13px]">Need help?</p>
            <button onClick={() => setOpen(false)} className="text-[var(--fg-mute)] hover:text-[var(--fg)]">
              <X size={12} />
            </button>
          </div>

          <div className="py-1">
            <HelpItem
              href="/dashboard/troubleshoot"
              icon={<Activity size={13} />}
              title="Auto-troubleshoot"
              body="Fix HWID, invalid key, rate limits"
              accent
            />
            <HelpItem
              href="/dashboard/tickets/new"
              icon={<MessageSquare size={13} />}
              title="Open a ticket"
              body="Talk to a real person"
            />
            <HelpItem
              href="/faq"
              icon={<BookOpen size={13} />}
              title="FAQ"
              body="30+ common questions"
            />
          </div>

          <div className="px-4 py-2.5 border-t text-center text-[11px] text-[var(--fg-mute)]" style={{ borderColor: 'var(--hairline)' }}>
            Most issues self-fix in &lt;30 seconds
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105"
        style={{
          background: 'var(--brand-gradient)',
          color: '#3a2630',
          boxShadow: '0 8px 24px rgba(240,164,183,0.30), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
        aria-label="Get help"
      >
        <LifeBuoy size={18} />
      </button>
    </div>
  )
}

function HelpItem({ href, icon, title, body, accent }: { href: string; icon: React.ReactNode; title: string; body: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
    >
      <div className="flex items-start gap-3">
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: accent ? 'var(--brand-faint)' : 'var(--surface-2)', color: accent ? 'var(--brand)' : 'var(--fg-dim)' }}
        >
          {icon}
        </span>
        <div>
          <p className="text-[13px] font-semibold leading-tight">{title}</p>
          <p className="text-[11px] text-[var(--fg-mute)] leading-tight mt-0.5">{body}</p>
        </div>
      </div>
    </Link>
  )
}
