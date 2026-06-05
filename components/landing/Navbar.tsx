'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '/shop',     label: 'Arsenal' },
  { href: '/status',   label: 'Status'  },
  { href: '/changelog',label: 'Updates' },
  { href: '/dashboard/tickets', label: 'Support' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200"
      style={{
        background: scrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--hairline)' : '1px solid transparent',
      }}
    >
      <div className="container-x h-[60px] flex items-center justify-between">

        {/* Wordmark — refined, no logo block */}
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="text-[15px] font-medium tracking-tight text-[var(--fg)] transition-colors group-hover:text-[var(--c)]">
            Onyx
          </span>
          <span className="font-mono text-[10.5px] text-[var(--fg-mute)] tracking-[0.18em] uppercase">Services</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13.5px] text-[var(--fg-mute)] hover:text-[var(--fg)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/login" className="text-[13.5px] text-[var(--fg-mute)] hover:text-[var(--fg)] px-3 py-2 transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>

        <button className="md:hidden btn btn-icon" onClick={() => setOpen(o => !o)} aria-label="Menu">
          {open ? <X size={15} /> : <Menu size={15} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[var(--bg)] border-t border-[var(--hairline)] px-6 py-3 flex flex-col">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-sm text-[var(--fg-dim)] border-b border-[var(--hairline)] last:border-0">
              {l.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/login"    className="btn btn-line w-full justify-center">Sign in</Link>
            <Link href="/register" className="btn btn-primary w-full justify-center">Get started</Link>
          </div>
        </div>
      )}
    </header>
  )
}
