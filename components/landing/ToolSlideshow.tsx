'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'

interface Slide {
  slug:     string
  name:     string
  tag:      string                  // category badge
  pitch:    string                  // 1-line description
  accent:   string                  // CSS color for the glow
  stat:     { label: string; value: string }[]
  price:    string                  // e.g. "$9.99/mo"
}

const slides: Slide[] = [
  {
    slug:   'onyx-rage',
    name:   'Rage',
    tag:    'Automation · Flagship',
    pitch:  'High-performance automation engine. Built for endurance. Used by 234 operators.',
    accent: '#ff3a00',
    stat:   [
      { label: 'Active users',  value: '234'      },
      { label: 'Status',        value: 'Undetected' },
      { label: 'Latency',       value: '<12ms'    },
    ],
    price:  '$9.99 /mo',
  },
  {
    slug:   'onyx-stealth',
    name:   'Stealth',
    tag:    'Stealth · Premium',
    pitch:  'Precision detection bypass for operators working at the edge of the meta.',
    accent: '#ff7a4d',
    stat:   [
      { label: 'Active users',  value: '89'       },
      { label: 'Status',        value: 'Undetected' },
      { label: 'Bypass rate',   value: '99.6%'    },
    ],
    price:  '$14.99 /mo',
  },
  {
    slug:   'onyx-core',
    name:   'Core',
    tag:    'Utility · Best Seller',
    pitch:  'The reliable foundation. Daily driver, always updated, never lets you down.',
    accent: '#5fcb88',
    stat:   [
      { label: 'Active users',  value: '412'      },
      { label: 'Status',        value: 'Undetected' },
      { label: 'Uptime',        value: '99.97%'   },
    ],
    price:  '$6.99 /mo',
  },
  {
    slug:   'onyx-apex',
    name:   'Apex',
    tag:    'Premium · Elite',
    pitch:  'Reserved for serious operators. Our most powerful suite, gated behind tier.',
    accent: '#ffae50',
    stat:   [
      { label: 'Active users',  value: '42'       },
      { label: 'Status',        value: 'Updating' },
      { label: 'Tier',          value: 'Diamond+' },
    ],
    price:  '$29.99 /mo',
  },
]

const AUTO_MS = 6000

export function ToolSlideshow() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (paused) return
    timer.current = setTimeout(() => setIndex(i => (i + 1) % slides.length), AUTO_MS)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [index, paused])

  const go = (direction: 1 | -1) => {
    setIndex(i => (i + direction + slides.length) % slides.length)
  }

  return (
    <section className="border-b border-[var(--hairline)] bg-section-c relative overflow-hidden" style={{ padding: '7rem 0' }}>

      {/* Atmosphere */}
      <div className="absolute inset-0 bg-grid-soft pointer-events-none opacity-30" />

      <div className="container-x relative z-10">

        {/* Section label */}
        <div className="grid grid-cols-12 gap-8 lg:gap-12 mb-10">
          <div className="col-span-12 lg:col-span-3">
            <span className="label-mono">005 — In the field</span>
          </div>
          <div className="col-span-12 lg:col-span-9 flex items-end justify-between gap-4 flex-wrap">
            <h2 className="text-[var(--fg)]" style={{
              fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              fontWeight: 500,
            }}>
              Currently{' '}
              <span className="font-serif-i text-[var(--fg-mute)]" style={{ fontWeight: 400 }}>shipping.</span>
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => go(-1)} className="btn btn-icon" aria-label="Previous"><ChevronLeft size={14} /></button>
              <span className="font-mono text-[11px] text-[var(--fg-mute)] px-3 py-1 tabular-nums">
                {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
              <button onClick={() => go(1)} className="btn btn-icon" aria-label="Next"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>

        {/* The slide */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative"
        >
          {slides.map((slide, i) => {
            const active = i === index
            return (
              <div
                key={slide.slug}
                aria-hidden={!active}
                style={{
                  opacity:           active ? 1 : 0,
                  transform:         active ? 'translateY(0)' : 'translateY(20px)',
                  pointerEvents:     active ? 'auto' : 'none',
                  transition:        'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
                  position:          active ? 'relative' : 'absolute',
                  top:               active ? undefined : 0,
                  left:              active ? undefined : 0,
                  right:             active ? undefined : 0,
                }}
              >
                <div className="grid grid-cols-12 gap-8 lg:gap-12 items-stretch">

                  {/* Big serif name + pitch */}
                  <div className="col-span-12 lg:col-span-7">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] mb-5 block" style={{ color: slide.accent }}>
                      {slide.tag}
                    </span>
                    <h3 className="text-[var(--fg)] mb-6" style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 'clamp(3.5rem, 7vw, 6rem)',
                      lineHeight: 0.95,
                      letterSpacing: '-0.035em',
                      fontWeight: 400,
                    }}>
                      Onyx <span className="font-serif-i" style={{ color: slide.accent }}>{slide.name}</span>
                    </h3>
                    <p className="text-[var(--fg-dim)] text-[16px] leading-[1.55] max-w-[480px] mb-10">{slide.pitch}</p>
                    <Link href={`/shop/onyx-${slide.name.toLowerCase()}`} className="inline-flex items-center gap-2 text-[var(--fg)] hover:text-[var(--c)] transition-colors text-[14px] underline underline-offset-4 decoration-[var(--fg-faint)] hover:decoration-[var(--c)]">
                      Open dossier
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>

                  {/* Stat panel — sits like a HUD overlay */}
                  <div className="col-span-12 lg:col-span-5">
                    <div className="relative h-full">

                      {/* Backing glow */}
                      <div className="absolute -inset-6 rounded-md pointer-events-none"
                        style={{ background: `radial-gradient(circle at 60% 40%, ${slide.accent}1a, transparent 70%)` }}
                      />

                      <div className="relative h-full rounded-md p-7"
                        style={{
                          background: 'linear-gradient(180deg, #0d0d0d 0%, #060606 100%)',
                          border:     '1px solid #2a2a2a',
                          boxShadow:  `0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)`,
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#1a1a1a]">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: slide.accent, boxShadow: `0 0 8px ${slide.accent}` }} />
                            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--fg-mute)]">Live signal</span>
                          </div>
                          <span className="font-mono text-[10.5px] tracking-[0.16em] text-[var(--fg-faint)] uppercase">vault.v2</span>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-col gap-5 mb-6">
                          {slide.stat.map(s => (
                            <div key={s.label} className="flex items-baseline justify-between pb-3 border-b border-[#181818]">
                              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--fg-mute)]">{s.label}</span>
                              <span className="text-[var(--fg)]" style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: '20px',
                                letterSpacing: '-0.02em',
                                lineHeight: 1,
                                fontWeight: 400,
                              }}>
                                {s.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline justify-between">
                          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--fg-mute)]">Starting at</span>
                          <span className="text-[var(--fg)]" style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '26px',
                            letterSpacing: '-0.02em',
                            lineHeight: 1,
                            color: slide.accent,
                            fontWeight: 400,
                          }}>
                            {slide.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Slide dots */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {slides.map((s, i) => (
            <button
              key={s.slug}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="transition-all duration-300"
              style={{
                width:      i === index ? '24px' : '6px',
                height:     '2px',
                background: i === index ? slides[index].accent : 'var(--hairline-2)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
