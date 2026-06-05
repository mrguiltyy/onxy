'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const all = [
  { slug: 'onyx-rage',    no: '01', name: 'Rage',    line: 'Automation', desc: 'High-performance automation engine with real-time anti-detection.',     price:  999, status: 'undetected', updated: '2h',  sold: 234 },
  { slug: 'onyx-stealth', no: '02', name: 'Stealth', line: 'Stealth',    desc: 'Precision detection bypass for operators working at the edge.',         price: 1499, status: 'undetected', updated: '5h',  sold:  89 },
  { slug: 'onyx-core',    no: '03', name: 'Core',    line: 'Utility',    desc: 'The reliable foundation. Fast, daily-driver, always updated.',          price:  699, status: 'undetected', updated: '1d',  sold: 412 },
  { slug: 'onyx-apex',    no: '04', name: 'Apex',    line: 'Premium',    desc: 'Elite-tier access. Reserved for serious operators.',                    price: 2999, status: 'updating',   updated: 'now', sold:  42 },
  { slug: 'onyx-pulse',   no: '05', name: 'Pulse',   line: 'Automation', desc: 'Lightweight automation companion. Quick setup, focused feature set.',   price:  499, status: 'beta',       updated: '3h',  sold:  68 },
  { slug: 'onyx-blade',   no: '06', name: 'Blade',   line: 'Stealth',    desc: 'Cutting-edge stealth with cryptographic process isolation.',            price: 1799, status: 'undetected', updated: '8h',  sold: 132 },
  { slug: 'onyx-echo',    no: '07', name: 'Echo',    line: 'Utility',    desc: 'Companion utility for monitoring sessions, HWIDs, and tool state.',     price:  599, status: 'undetected', updated: '12h', sold: 207 },
  { slug: 'onyx-vortex',  no: '08', name: 'Vortex',  line: 'Premium',    desc: 'Premium toolset with advanced session orchestration.',                  price: 2499, status: 'undetected', updated: '4h',  sold:  31 },
]

const filters = ['All', 'Automation', 'Stealth', 'Utility', 'Premium']

const statusLabel = {
  undetected: { text: 'Undetected', cls: 'status-ok'   },
  updating:   { text: 'Updating',   cls: 'status-warn' },
  beta:       { text: 'Beta',       cls: 'status-info' },
} as const

export function FeaturedProducts() {
  const [filter, setFilter] = useState('All')
  const filtered = filter === 'All' ? all : all.filter(p => p.line === filter)

  return (
    <section id="products" className="border-b border-[var(--hairline)] bg-section-b relative overflow-hidden" style={{ padding: '7rem 0' }}>
      <div className="absolute inset-0 bg-dots-soft pointer-events-none opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(255,58,0,0.05) 0%, transparent 60%)' }}
      />
      <div className="container-x relative z-10">

        <div className="grid grid-cols-12 gap-8 lg:gap-12 mb-16">

          <div className="col-span-12 lg:col-span-3">
            <span className="label-mono">001 — Arsenal</span>
            <p className="label-mono text-[var(--fg-faint)] mt-6 max-w-[180px] hidden lg:block normal-case tracking-normal" style={{ letterSpacing: '0.05em' }}>
              Eight tools.<br />Live status updated.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-9">
            <h2 className="text-[var(--fg)] mb-3" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              fontWeight: 500,
            }}>
              Eight tools.{' '}
              <span className="font-serif-i text-[var(--fg-mute)]" style={{ fontWeight: 400 }}>One philosophy.</span>
            </h2>
            <p className="text-[var(--fg-dim)] mb-10 max-w-[560px]" style={{ fontSize: '15.5px', lineHeight: 1.55 }}>
              Each one purpose-built, version-locked, and impossible to share. We don&apos;t do bundles —
              we ship sharpened instruments.
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              {filters.map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`filter-btn ${filter === f ? 'active' : ''}`}>
                  {f}
                  {f !== 'All' && (
                    <span className="text-[10.5px] opacity-50 ml-0.5">/ {all.filter(p => p.line === f).length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editorial list — rows divided by hairline rules */}
        <div className="border-t border-[var(--hairline)]">
          {filtered.map((p, i) => {
            const s = statusLabel[p.status as keyof typeof statusLabel]
            return (
              <Link
                key={p.slug}
                href={`/shop/${p.slug}`}
                className="group grid grid-cols-12 gap-4 lg:gap-6 py-7 lg:py-9 border-b border-[var(--hairline)] hover:bg-[#080808] transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* No */}
                <div className="col-span-2 lg:col-span-1">
                  <span className="font-mono text-[12px] text-[var(--fg-mute)] tracking-widest">{p.no}</span>
                </div>

                {/* Name */}
                <div className="col-span-10 lg:col-span-3">
                  <h3 className="text-[var(--fg)] mb-2 group-hover:text-[var(--c)] transition-colors duration-200" style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.875rem, 3.2vw, 2.625rem)',
                    letterSpacing: '-0.025em',
                    lineHeight: 1,
                    fontWeight: 400,
                  }}>
                    Onyx <span className="font-serif-i">{p.name}</span>
                  </h3>
                  <span className="label-mono">{p.line}</span>
                </div>

                {/* Description */}
                <div className="hidden lg:block col-span-4">
                  <p className="text-[14px] text-[var(--fg-dim)] leading-[1.6] max-w-[360px]">
                    {p.desc}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-6 lg:col-span-2 flex flex-col gap-2 items-start">
                  <span className={`status ${s.cls}`}>
                    <span className="status-dot" />
                    {s.text}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--fg-mute)]">
                    {p.sold} sold · upd {p.updated}
                  </span>
                </div>

                {/* Price */}
                <div className="col-span-6 lg:col-span-2 flex items-start justify-end gap-3">
                  <div className="text-right">
                    <span className="text-[var(--fg)]" style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
                      letterSpacing: '-0.02em',
                    }}>
                      ${(p.price / 100).toFixed(0)}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--fg-mute)] ml-1">/mo</span>
                  </div>
                  <ArrowUpRight
                    size={20}
                    className="text-[var(--fg-mute)] group-hover:text-[var(--c)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 mt-1"
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
