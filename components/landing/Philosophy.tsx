export function Philosophy() {
  const tenets = [
    {
      n: '01',
      title: 'No bundles. No bloat.',
      body: 'Every tool is its own dossier — purpose-built, not padded. You buy what you need; we don\'t pad the catalog to inflate value.',
    },
    {
      n: '02',
      title: 'Your hardware, your license.',
      body: 'Each key binds to the machine that registers it. Sharing isn\'t possible by design. Attempt it, the tool self-locks.',
    },
    {
      n: '03',
      title: 'If it leaks, we know.',
      body: 'Every download embeds your user ID at the byte level. Public surfaces? Traced back in minutes. Banned the same day.',
    },
  ]

  return (
    <section className="border-b border-[var(--hairline)] bg-section-c glow-radial-right relative overflow-hidden" style={{ padding: '7rem 0' }}>
      <div className="container-x relative z-10">
        <div className="grid grid-cols-12 gap-8 lg:gap-12">

          <div className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-32">
              <span className="label-mono">002 — Doctrine</span>
              <p className="label-mono text-[var(--fg-faint)] mt-6 max-w-[180px] hidden lg:block normal-case tracking-normal" style={{ letterSpacing: '0.05em' }}>
                What we build,<br />and what we don&apos;t.
              </p>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9">

            <h2 className="text-[var(--fg)] mb-16 lg:mb-20 max-w-[820px]" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              fontWeight: 500,
            }}>
              We don&apos;t sell{' '}
              <span className="font-serif-i text-[var(--fg-mute)]" style={{ fontWeight: 400 }}>software.</span>{' '}
              We license{' '}
              <span style={{ color: 'var(--c)' }} className="font-serif-i">access.</span>
            </h2>

            <div className="flex flex-col gap-14 lg:gap-16">
              {tenets.map(t => (
                <div key={t.n} className="grid grid-cols-12 gap-6 items-start">
                  <div className="col-span-2 lg:col-span-1">
                    <span className="font-mono text-[11px] text-[var(--fg-mute)] tracking-widest">{t.n}</span>
                  </div>
                  <div className="col-span-10 lg:col-span-11">
                    <h3 className="text-[var(--fg)] mb-3" style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 'clamp(1.5rem, 2.5vw, 2.125rem)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                      fontWeight: 400,
                    }}>
                      {t.title}
                    </h3>
                    <p className="text-[15px] text-[var(--fg-dim)] leading-[1.65] max-w-[640px]">
                      {t.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
