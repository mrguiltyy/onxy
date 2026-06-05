import Link from 'next/link'
import { ShieldCheck, Zap, RefreshCw, Lock, Users, ArrowUpRight } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[480px_1fr] xl:grid-cols-[560px_1fr]">

      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL — Brand + Discord (hidden on mobile)
          ═══════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex relative flex-col p-10 xl:p-12 border-r border-white/[0.04] overflow-hidden">

        {/* Layered atmospheric background */}
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="absolute inset-0 bg-grid-soft pointer-events-none opacity-50" />

        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(255,58,0,0.12)' }}
        />

        {/* Decorative orbital rings (behind logo) */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(255,58,0,0.06)' }}
        />
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 mt-10 w-[260px] h-[260px] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(255,58,0,0.1)' }}
        />

        {/* ─── Top: Logo + Brand ─────────────────────────────── */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-12">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ff3a00] to-[#cc2e00] flex items-center justify-center font-black text-[#0a0d14] text-base transition-transform duration-200 group-hover:scale-105"
              style={{ boxShadow: '0 4px 16px rgba(255,58,0,0.3)' }}
            >
              O
            </div>
            <span className="font-bold text-[17px] tracking-tight text-white">
              Onyx<span className="text-[#ff3a00]">Services</span>
            </span>
          </Link>
        </div>

        {/* ─── Middle: Brand mark + welcome ──────────────────── */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-8">

          {/* Big O hexagon mark */}
          <div className="relative w-40 h-40 mb-8 mx-auto lg:mx-0">

            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255,58,0,0.2) 0%, transparent 70%)',
                animation: 'throb 4s ease-in-out infinite',
              }}
            />

            {/* The mark */}
            <div className="relative w-full h-full rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ff3a00 0%, #cc2e00 100%)',
                boxShadow: '0 20px 60px rgba(255,58,0,0.35), inset 0 2px 8px rgba(255,255,255,0.25)',
              }}
            >
              <span className="text-[72px] font-black text-white leading-none"
                style={{ letterSpacing: '-0.08em', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
              >
                O
              </span>
              {/* Inner highlight */}
              <div className="absolute top-2 left-2 right-4 h-1/3 rounded-2xl opacity-40 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.5), transparent)' }}
              />
            </div>

            {/* Outer glow */}
            <div className="absolute inset-0 rounded-3xl blur-3xl opacity-50 -z-10" style={{ background: '#ff3a00' }} />
          </div>

          {/* Welcome heading */}
          <h2 className="text-white font-bold tracking-tight mb-3"
            style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.25rem)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
          >
            Welcome to the<br />
            <span style={{
              background: 'linear-gradient(135deg, #ff3a00 0%, #ff5b75 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              private arsenal.
            </span>
          </h2>
          <p className="text-[#9ca3af] text-[14.5px] leading-relaxed max-w-md">
            Hardware-locked tools, instant delivery, and a community of <span className="text-white font-semibold">1,248 operators</span> already inside.
          </p>
        </div>

        {/* ─── Discord invite card ───────────────────────────── */}
        <a
          href="https://discord.gg/onyx"
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 group block mb-6 p-5 rounded-xl overflow-hidden border transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(88,101,242,0.12) 0%, rgba(88,101,242,0.04) 100%)',
            borderColor: 'rgba(88,101,242,0.25)',
          }}
        >
          {/* Glow on hover */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-50 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none"
            style={{ background: '#5865F2', transform: 'translate(20px, -20px)' }}
          />

          <div className="relative flex items-start gap-4">
            {/* Discord icon tile */}
            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: '#5865F2', boxShadow: '0 4px 12px rgba(88,101,242,0.4)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-semibold text-[14px]">Join our Discord</p>
                <ArrowUpRight size={13} className="text-white/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="text-[#9ca3af] text-[12.5px] leading-snug mb-2">
                Get product alerts, support, and connect with the community.
              </p>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5fcb88]" style={{ boxShadow: '0 0 6px #5fcb88' }} />
                  <span className="text-[#5fcb88] font-semibold">2,847 online</span>
                </div>
                <span className="text-[#4b5563]">·</span>
                <div className="flex items-center gap-1.5 text-[#9ca3af]">
                  <Users size={10} />
                  <span>12,408 members</span>
                </div>
              </div>
            </div>
          </div>
        </a>

        {/* ─── Bottom: Feature bullets ───────────────────────── */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {[
            { icon: ShieldCheck, label: 'HWID Locked'      },
            { icon: Zap,         label: 'Instant Delivery' },
            { icon: RefreshCw,   label: 'Auto-Updates'     },
            { icon: Lock,        label: 'Encrypted Drops'  },
          ].map(item => {
            const I = item.icon
            return (
              <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(20,24,35,0.5)] border border-white/[0.04]">
                <div className="w-6 h-6 rounded-md bg-[rgba(255,58,0,0.08)] border border-[rgba(255,58,0,0.15)] flex items-center justify-center shrink-0">
                  <I size={11} className="text-[#ff3a00]" />
                </div>
                <span className="text-[#d4d4d8] text-[12px] font-medium">{item.label}</span>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL — Form
          ═══════════════════════════════════════════════════════ */}
      <main className="relative flex flex-col min-h-screen">

        {/* Mobile header (logo only) */}
        <header className="lg:hidden px-6 py-5 border-b border-white/[0.04]">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff3a00] to-[#cc2e00] flex items-center justify-center font-black text-[#0a0d14] text-sm">
              O
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">
              Onyx<span className="text-[#ff3a00]">Services</span>
            </span>
          </Link>
        </header>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-12">
          {children}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 text-center border-t border-white/[0.04]">
          <p className="text-[#6b7280] text-[11px]">
            © {new Date().getFullYear()} Onyx Services · {' '}
            <Link href="/terms"   className="hover:text-[#9ca3af]">Terms</Link> · {' '}
            <Link href="/privacy" className="hover:text-[#9ca3af]">Privacy</Link>
          </p>
        </footer>
      </main>
    </div>
  )
}
