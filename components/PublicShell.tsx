import Link from 'next/link'
import { Logo } from './Logo'
import { PublicHeaderNav } from './PublicHeaderNav'

export function PublicShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(10,13,20,0.72)',
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          borderBottom: '1px solid rgba(42,49,66,0.6)',
        }}
      >
        <div className="container-x flex items-center justify-between py-3.5 gap-6">
          <Logo size="sm" />
          <PublicHeaderNav />
        </div>
      </header>

      <main className="flex-1 py-16 md:py-20">
        <div className={`container-x ${wide ? 'max-w-[1180px]' : 'max-w-[760px]'}`}>
          {children}
        </div>
      </main>

      <footer className="py-12 border-t" style={{ borderColor: 'var(--hairline)' }}>
        <div className="container-x">
          <div className="flex items-start justify-between flex-wrap gap-8 mb-8">
            <div className="max-w-[300px]">
              <Logo size="sm" />
              <p className="text-[12.5px] text-[var(--fg-mute)] mt-4 leading-relaxed">
                Marketplace + auth engine for private tools. Educational use only.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-x-12 gap-y-1.5 text-[12.5px]">
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-[0.15em] text-[var(--fg-mute)] mb-3">Platform</p>
                <Link href="/products" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">Products</Link>
                <Link href="/reseller" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">Reseller</Link>
                <Link href="/rebrand"  className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">Rebrand</Link>
                <Link href="/status"   className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">Status</Link>
              </div>
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-[0.15em] text-[var(--fg-mute)] mb-3">Resources</p>
                <Link href="/blog" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">Blog</Link>
                <Link href="/faq"  className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">FAQ</Link>
                <Link href="/login" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">Sign in</Link>
                <Link href="/register" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">Sign up</Link>
              </div>
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-[0.15em] text-[var(--fg-mute)] mb-3">Legal</p>
                <Link href="/terms"   className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">Terms</Link>
                <Link href="/privacy" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
          <div className="border-t pt-5 flex items-center justify-between flex-wrap gap-3 text-[11px] text-[var(--fg-mute)]"
            style={{ borderColor: 'var(--hairline)' }}>
            <p>© {new Date().getFullYear()} OP · All rights reserved</p>
            <p>Educational use only · Buyer assumes all responsibility</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
