import Link from 'next/link'
import { BrandRow } from './Brand'

export function PublicShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(10,13,20,0.85)',
          borderColor: 'var(--hairline)',
          backdropFilter: 'blur(14px) saturate(180%)',
        }}
      >
        <div className="container-x flex items-center justify-between py-3">
          <BrandRow />
          <nav className="hidden md:flex items-center gap-5">
            <Link href="/products" className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Products</Link>
            <Link href="/reseller" className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Reseller</Link>
            <Link href="/blog"     className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Blog</Link>
            <Link href="/faq"      className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">FAQ</Link>
            <Link href="/status"   className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Status</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"    className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Sign in</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Sign up</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className={`container-x ${wide ? 'max-w-[1180px]' : 'max-w-[760px]'}`}>
          {children}
        </div>
      </main>

      <footer className="py-10 border-t" style={{ borderColor: 'var(--hairline)' }}>
        <div className="container-x">
          <div className="flex items-start justify-between flex-wrap gap-6 mb-6">
            <div>
              <BrandRow />
              <p className="text-[12px] text-[var(--fg-mute)] mt-2 max-w-[280px]">
                Marketplace + auth engine for private tools. Educational use only.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-x-10 gap-y-1.5 text-[12.5px]">
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-wider text-[var(--fg-mute)] mb-2">Platform</p>
                <Link href="/products" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-0.5">Products</Link>
                <Link href="/reseller" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-0.5">Reseller</Link>
                <Link href="/status"   className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-0.5">Status</Link>
              </div>
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-wider text-[var(--fg-mute)] mb-2">Resources</p>
                <Link href="/blog" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-0.5">Blog</Link>
                <Link href="/faq"  className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-0.5">FAQ</Link>
                <Link href="/login" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-0.5">Sign in</Link>
              </div>
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-wider text-[var(--fg-mute)] mb-2">Legal</p>
                <Link href="/terms"   className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-0.5">Terms</Link>
                <Link href="/privacy" className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-0.5">Privacy</Link>
              </div>
            </div>
          </div>
          <div className="border-t pt-4 flex items-center justify-between flex-wrap gap-2 text-[11px] text-[var(--fg-mute)]"
            style={{ borderColor: 'var(--hairline)' }}>
            <p>© {new Date().getFullYear()} OP · All rights reserved</p>
            <p>Educational use only · Buyer assumes all responsibility</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
