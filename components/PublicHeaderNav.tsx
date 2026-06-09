'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'

const LINKS: { href: string; label: string }[] = [
  { href: '/products', label: 'Products' },
  { href: '/reseller', label: 'Reseller' },
  { href: '/rebrand',  label: 'Rebrand'  },
  { href: '/blog',     label: 'Blog'     },
  { href: '/faq',      label: 'FAQ'      },
]

export function PublicHeaderNav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <>
      {/* Center nav (desktop) */}
      <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
        {LINKS.map(link => {
          const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href + '/'))
          return (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-[14px] font-semibold rounded-full transition-all group"
              style={{
                color:      active ? 'var(--fg)' : 'var(--fg-dim)',
                background: active ? 'var(--surface-2)' : 'transparent',
                letterSpacing: '-0.01em',
              }}
            >
              {link.label}
              <span
                className="absolute left-1/2 -translate-x-1/2 bottom-0 h-0.5 rounded-full transition-all"
                style={{
                  background: 'var(--brand)',
                  width: active ? '16px' : '0',
                }}
              />
            </Link>
          )
        })}
      </nav>

      {/* Right CTAs (desktop) */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        <Link
          href="/login"
          className="px-4 py-2 text-[14px] font-semibold rounded-full transition-colors text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
          style={{ letterSpacing: '-0.01em' }}
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-2.5 text-[14px] font-bold rounded-full transition-all hover:shadow-[0_12px_32px_rgba(240,164,183,0.40)] hover:-translate-y-0.5"
          style={{
            background:  'linear-gradient(135deg, #f0a4b7 0%, #c5b3df 50%, #a2c8ee 100%)',
            color:       '#1a0e14',
            border:      '1px solid rgba(255,255,255,0.12)',
            letterSpacing: '-0.01em',
            boxShadow:   '0 6px 18px rgba(240,164,183,0.25), 0 0 0 1px rgba(255,255,255,0.06) inset',
          }}
        >
          Get started <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Mobile burger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden p-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--fg-dim)]"
        aria-label="Menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden absolute left-0 right-0 top-full"
          style={{
            background: 'rgba(10,13,20,0.96)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid var(--hairline)',
          }}
        >
          <div className="container-x py-5 flex flex-col gap-1.5">
            {LINKS.map(link => {
              const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href + '/'))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 text-[15px] font-semibold rounded-lg transition-colors"
                  style={{
                    color:      active ? 'var(--brand)' : 'var(--fg-dim)',
                    background: active ? 'var(--brand-faint)' : 'transparent',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}

            <div className="border-t mt-4 pt-4 flex gap-2.5" style={{ borderColor: 'var(--hairline)' }}>
              <Link href="/login" className="flex-1 text-center py-3 text-[14px] font-semibold rounded-lg transition-colors text-[var(--fg-dim)] hover:bg-[var(--surface-2)]"
                style={{ border: '1px solid var(--hairline)' }}>
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-[14px] font-bold rounded-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #f0a4b7 0%, #c5b3df 50%, #a2c8ee 100%)',
                  color:      '#1a0e14',
                  boxShadow:  '0 6px 18px rgba(240,164,183,0.25)',
                }}
              >
                Get started <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
