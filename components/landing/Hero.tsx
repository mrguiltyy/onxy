import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TerminalBlock } from './TerminalBlock'

export function Hero() {
  return (
    <section className="relative pt-[60px] border-b border-[var(--hairline)] glow-radial-top overflow-hidden">

      {/* Ambient grid + subtle vignette */}
      <div className="absolute inset-0 bg-grid-soft pointer-events-none opacity-50" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,58,0,0.2)] to-transparent pointer-events-none" />

      <div className="container-x pt-20 lg:pt-28 pb-24 lg:pb-32 relative z-10">

        {/* Top strip: status indicator only */}
        <div className="flex items-center gap-2 mb-16 animate-fade-up">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ok)' }} />
          <span className="label-mono text-[var(--fg-mute)]">All systems operational</span>
        </div>

        <div className="grid grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* LEFT: Editorial headline */}
          <div className="col-span-12 lg:col-span-7">

            <h1 className="text-[var(--fg)] mb-10 animate-fade-up delay-100" style={{
              fontSize: 'clamp(3rem, 8vw, 7.5rem)',
              lineHeight: 0.92,
              letterSpacing: '-0.045em',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
            }}>
              Private tools.
              <br />
              <span className="font-serif-i" style={{ color: 'var(--c)', fontWeight: 400 }}>
                Locked
              </span>{' '}
              to your machine.
            </h1>

            <p className="text-[var(--fg-dim)] max-w-[520px] mb-12 animate-fade-up delay-200" style={{
              fontSize: 'clamp(15px, 1.4vw, 18px)',
              lineHeight: 1.55,
            }}>
              Onyx Services ships purpose-built software with hardware-bound licensing,
              silent auto-updates, and a leak trail that always points home.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-16 animate-fade-up delay-300">
              <Link href="/shop" className="btn btn-primary btn-primary-lg group">
                Browse the arsenal
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/docs" className="text-[14px] text-[var(--fg)] hover:text-[var(--c)] transition-colors underline underline-offset-4 decoration-[var(--fg-faint)] hover:decoration-[var(--c)]">
                Read the docs
              </Link>
            </div>

            {/* Inline footnote stats — restrained */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-10 border-t border-[var(--hairline)] animate-fade-up delay-400">
              {[
                { v: '8',       l: 'Tools shipped'    },
                { v: '1,248',   l: 'Operators inside' },
                { v: '99.97%',  l: 'Uptime · 90d'     },
                { v: '47',      l: 'Days · no incident' },
              ].map(s => (
                <div key={s.l}>
                  <p className="text-[var(--fg)] mb-1.5" style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.75rem, 2.8vw, 2.5rem)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}>
                    {s.v}
                  </p>
                  <p className="label-mono">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Terminal block — the real hero visual */}
          <div className="col-span-12 lg:col-span-5 lg:pt-2 animate-fade-up delay-500">
            <div className="lg:sticky lg:top-32">
              <div className="flex items-center justify-between mb-3">
                <span className="label-mono">// live · auth trace</span>
                <span className="label-mono text-[var(--fg-faint)]">v.2.1.0</span>
              </div>
              <TerminalBlock />
              <p className="text-[12px] text-[var(--fg-mute)] mt-3 max-w-[400px]">
                Every tool authenticates against the license server on launch.
                Sessions heartbeat every 5 minutes. If it doesn&apos;t pulse, it doesn&apos;t run.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
