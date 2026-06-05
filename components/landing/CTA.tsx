import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="border-b border-[var(--hairline)] bg-section-c glow-radial-bottom relative overflow-hidden" style={{ padding: '8rem 0' }}>
      <div className="absolute inset-0 bg-grid-soft pointer-events-none opacity-30" />
      <div className="container-x relative z-10">
        <div className="grid grid-cols-12 gap-8 lg:gap-12">

          <div className="col-span-12 lg:col-span-3">
            <span className="label-mono">005 — Access</span>
          </div>

          <div className="col-span-12 lg:col-span-9">

            <h2 className="text-[var(--fg)] mb-8 max-w-[820px]" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              fontWeight: 500,
            }}>
              Create an account.{' '}
              <span className="font-serif-i text-[var(--fg-mute)]" style={{ fontWeight: 400 }}>Or don&apos;t.</span>
            </h2>

            <p className="text-[var(--fg-dim)] mb-12 max-w-[580px]" style={{ fontSize: '17px', lineHeight: 1.55 }}>
              Free to sign up, free to browse. You only pay if you find something worth paying for —
              and we think you will.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Link href="/register" className="btn btn-primary btn-primary-lg group">
                Create account
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/shop" className="text-[14px] text-[var(--fg)] hover:text-[var(--c)] transition-colors underline underline-offset-4 decoration-[var(--fg-faint)] hover:decoration-[var(--c)]">
                Browse first
              </Link>
            </div>

            <p className="label-mono text-[var(--fg-faint)] max-w-md">
              No card required · instant delivery · hwid-locked from the first byte
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
