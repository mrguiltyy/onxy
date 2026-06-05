const featured = {
  body:    'The smoothest license system I\'ve used. Updates happen silently in the background. Auth is instant. Support answers in minutes. There\'s nothing else like it on the market.',
  name:    'DarkByte',
  product: 'Onyx Rage · 6 months',
}

const more = [
  { body: 'Support actually responds in minutes. License system is rock solid.', name: 'NxGhost',   product: 'Onyx Stealth' },
  { body: 'Bought lifetime on day one. Still using it 6 months later, no issues.', name: 'ShadowFx', product: 'Onyx Core'    },
  { body: 'Stays undetected. Updates the second a patch drops. On point.',         name: 'ZeroFrost', product: 'Onyx Apex'    },
]

export function Reviews() {
  return (
    <section className="border-b border-[var(--hairline)] bg-paper relative overflow-hidden" style={{ padding: '7rem 0' }}>
      <div className="absolute top-1/2 -left-32 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(255,58,0,0.04) 0%, transparent 60%)' }}
      />
      <div className="container-x relative z-10">

        <div className="grid grid-cols-12 gap-8 lg:gap-12">

          <div className="col-span-12 lg:col-span-3">
            <span className="label-mono">004 — Field reports</span>
          </div>

          <div className="col-span-12 lg:col-span-9">

            {/* Big serif pull-quote */}
            <blockquote className="mb-20 lg:mb-24">
              <p className="text-[var(--fg)] mb-8" style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3.5vw, 3rem)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                fontWeight: 400,
              }}>
                <span className="text-[var(--fg-mute)] font-serif-i">&ldquo;</span>
                {featured.body}
                <span className="text-[var(--fg-mute)] font-serif-i">&rdquo;</span>
              </p>
              <footer className="flex items-center gap-3">
                <span className="block w-8 h-px" style={{ background: 'var(--fg-faint)' }} />
                <cite className="not-italic">
                  <span className="text-[14px] text-[var(--fg)] font-medium">{featured.name}</span>
                  <span className="text-[13px] text-[var(--fg-mute)] ml-2">— {featured.product}</span>
                </cite>
              </footer>
            </blockquote>

            {/* Quiet wall of more reviews */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10 pt-12 border-t border-[var(--hairline)]">
              {more.map(r => (
                <div key={r.name}>
                  <p className="text-[var(--fg-dim)] mb-4" style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '18px',
                    lineHeight: 1.45,
                    letterSpacing: '-0.01em',
                  }}>
                    &ldquo;{r.body}&rdquo;
                  </p>
                  <p className="text-[13px] text-[var(--fg)]">
                    {r.name} <span className="text-[var(--fg-mute)] ml-1">— {r.product}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
