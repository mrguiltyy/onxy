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
          <nav className="flex items-center gap-5">
            <Link href="/products" className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Products</Link>
            <Link href="/faq"      className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">FAQ</Link>
            <Link href="/terms"    className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Terms</Link>
            <Link href="/login"    className="btn btn-primary btn-sm">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className={`container-x ${wide ? 'max-w-[1180px]' : 'max-w-[760px]'}`}>
          {children}
        </div>
      </main>

      <footer className="py-8 border-t" style={{ borderColor: 'var(--hairline)' }}>
        <div className="container-x flex items-center justify-between flex-wrap gap-4">
          <BrandRow />
          <p className="text-[11px] text-[var(--fg-mute)]">
            © {new Date().getFullYear()} OP · Educational use only
          </p>
        </div>
      </footer>
    </div>
  )
}
