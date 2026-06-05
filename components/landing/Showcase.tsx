import { ArrowUpRight, Cpu, Lock, Activity, RefreshCw } from 'lucide-react'
import Link from 'next/link'

/**
 * Showcase section — a real product surface as the centerpiece.
 * Shows a rendered "license card" mockup giving the page tangible depth.
 */
export function Showcase() {
  return (
    <section className="border-b border-[var(--hairline)] bg-section-b glow-radial-left relative overflow-hidden" style={{ padding: '7rem 0' }}>

      <div className="absolute inset-0 bg-grid-soft pointer-events-none opacity-40" />

      <div className="container-x relative z-10">
        <div className="grid grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left: section label + copy */}
          <div className="col-span-12 lg:col-span-5">
            <span className="label-mono mb-8 block">003 — Surface</span>

            <h2 className="text-[var(--fg)] mb-6" style={{
              fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              fontWeight: 500,
            }}>
              Every license is a{' '}
              <span className="font-serif-i text-[var(--fg-mute)]" style={{ fontWeight: 400 }}>
                living object.
              </span>
            </h2>

            <p className="text-[var(--fg-dim)] mb-10 max-w-[440px]" style={{ fontSize: '15.5px', lineHeight: 1.6 }}>
              The dashboard treats each purchase as a complete dossier — bound hardware,
              session state, version history, manual controls. Not a row in a table. A surface.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { icon: Cpu,       label: 'Hardware fingerprint', value: 'sha256 · 64 chars' },
                { icon: Lock,      label: 'Session token',         value: 'bearer · in-memory' },
                { icon: Activity,  label: 'Heartbeat',             value: 'every 300s · live'  },
                { icon: RefreshCw, label: 'Auto-update',           value: 'manifest · sha256'  },
              ].map(row => {
                const I = row.icon
                return (
                  <div key={row.label} className="flex items-center gap-3 pb-4 border-b border-[var(--hairline)]">
                    <I size={14} className="text-[var(--c)] shrink-0" strokeWidth={1.5} />
                    <span className="text-[13.5px] text-[var(--fg-dim)] flex-1">{row.label}</span>
                    <span className="font-mono text-[11.5px] text-[var(--fg-mute)]">{row.value}</span>
                  </div>
                )
              })}
            </div>

            <Link href="/docs" className="text-[14px] text-[var(--fg)] hover:text-[var(--c)] transition-colors inline-flex items-center gap-1.5 group">
              See the integration docs
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Right: rendered license card mockup */}
          <div className="col-span-12 lg:col-span-7 lg:pl-8">

            <div className="relative">
              {/* Drop shadow / glow underneath */}
              <div className="absolute -inset-6 rounded-[12px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, rgba(255,58,0,0.08), transparent 70%)' }}
              />

              <div className="relative rounded-[10px] overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #0d0d0d 0%, #080808 100%)',
                  border: '1px solid #2a2a2a',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset',
                }}
              >
                {/* Header bar */}
                <div className="px-5 py-3 border-b border-[#1a1a1a] flex items-center justify-between" style={{ background: '#0a0a0a' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ok)', boxShadow: '0 0 8px var(--ok)' }} />
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--fg-mute)]">
                      License · Active
                    </span>
                  </div>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
                    surface.v2
                  </span>
                </div>

                <div className="p-6">
                  {/* Product name + version */}
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-mute)] mb-1">Product</p>
                      <h3 className="text-[var(--fg)]" style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '2rem',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        fontWeight: 400,
                      }}>
                        Onyx <span className="font-serif-i">Rage</span>
                      </h3>
                    </div>
                    <span className="font-mono text-[11.5px] text-[var(--fg-mute)]">v.2.1.0</span>
                  </div>

                  {/* License key block */}
                  <div className="mb-5 p-3 rounded-md" style={{ background: '#050505', border: '1px solid #1a1a1a' }}>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-faint)] mb-1.5">License key</p>
                    <code className="font-mono text-[12.5px] tracking-wider" style={{ color: 'var(--c)' }}>
                      ONYX-R4G3-XK2M-9P7Q-LWTZ
                    </code>
                  </div>

                  {/* Stat grid — divided by hairlines */}
                  <div className="grid grid-cols-2 gap-px mb-5" style={{ background: '#1a1a1a' }}>
                    {[
                      { l: 'Plan',         v: '1 Month'      },
                      { l: 'Expires',      v: 'Jun 28, 2026' },
                      { l: 'HWID slots',   v: '1 of 2'       },
                      { l: 'Last session', v: '2 minutes ago'},
                    ].map(s => (
                      <div key={s.l} className="p-3" style={{ background: '#0a0a0a' }}>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-mute)] mb-1">{s.l}</p>
                        <p className="text-[14px] text-[var(--fg)]">{s.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Sessions row */}
                  <div className="mb-5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-mute)] mb-2">Live sessions</p>
                    <div className="flex items-center gap-2 p-2.5 rounded-md" style={{ background: '#050505', border: '1px solid #1a1a1a' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--ok)' }} />
                      <span className="font-mono text-[11.5px] text-[var(--fg-dim)] flex-1">
                        sess_4f8a7c92e1...d2e1b8
                      </span>
                      <span className="font-mono text-[10.5px] text-[var(--fg-mute)]">heartbeat · 47s ago</span>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2 pt-4 border-t border-[#1a1a1a]">
                    <button className="text-[12px] px-3 py-1.5 rounded text-[var(--bg)]" style={{ background: 'var(--fg)' }}>
                      Download tool
                    </button>
                    <button className="text-[12px] px-3 py-1.5 rounded text-[var(--fg-dim)] border border-[#262626]">
                      Reset HWID
                    </button>
                    <button className="text-[12px] px-3 py-1.5 rounded text-[var(--fg-mute)] hover:text-[var(--fg)] ml-auto">
                      Manage →
                    </button>
                  </div>
                </div>
              </div>

              {/* Side caption */}
              <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--fg-mute)] mt-4 flex items-center gap-2">
                <span className="w-3 h-px bg-[var(--fg-faint)]" />
                dashboard / library / [license_id]
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
