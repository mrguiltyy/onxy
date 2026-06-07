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

  // Close mobile menu on route change
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
              className="px-3.5 py-1.5 text-[13px] font-medium rounded-full transition-all relative"
              style={{
                color: active ? 'var(--fg)' : 'var(--fg-dim)',
                background: active ? 'var(--surface-2)' : 'transparent',
              }}
            >
              {link.label}
              {active && (
                <span
                  className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1 h-1 rounded-full"
                  style={{ background: 'var(--brand)' }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Right CTAs (desktop) */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <Link
          href="/login"
          className="px-3.5 py-1.5 text-[13px] font-medium rounded-full transition-colors text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold rounded-full transition-all hover:shadow-[0_8px_24px_rgba(240,164,183,0.32)]"
          style={{
            background:  'linear-gradient(135deg, #f0a4b7 0%, #c5b3df 50%, #a2c8ee 100%)',
            color:       '#1a0e14',
            border:      '1px solid rgba(255,255,255,0.10)',
          }}
        >
          Get started <ArrowRight size={12} />
        </Link>
      </div>

      {/* Mobile burger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden p-2 rounded-md hover:bg-[var(--surface-2)] transition-colors text-[var(--fg-dim)]"
        aria-label="Menu"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden absolute left-0 right-0 top-full"
          style={{
            background: 'rgba(10,13,20,0.95)',
            backdropFilter: 'blur(18px) saturate(180%)',
            borderBottom: '1px solid var(--hairline)',
          }}
        >
          <div className="container-x py-4 flex flex-col gap-1">
            {LINKS.map(link => {
              const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href + '/'))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2.5 text-[14px] font-medium rounded-md transition-colors"
                  style={{
                    color: active ? 'var(--brand)' : 'var(--fg-dim)',
                    background: active ? 'var(--brand-faint)' : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}

            <div className="border-t mt-3 pt-3 flex gap-2" style={{ borderColor: 'var(--hairline)' }}>
              <Link href="/login" className="flex-1 text-center py-2.5 text-[13.5px] font-medium rounded-md transition-colors text-[var(--fg-dim)] hover:bg-[var(--surface-2)]"
                style={{ border: '1px solid var(--hairline)' }}>
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13.5px] font-semibold rounded-md transition-all"
                style={{
                  background: 'linear-gradient(135deg, #f0a4b7 0%, #c5b3df 50%, #a2c8ee 100%)',
                  color:      '#1a0e14',
                }}
              >
                Get started <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
