import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

const entries = [
  {
    date:    'Jun 1, 2026',
    version: 'v2.4.0',
    tag:     'Platform',
    items: [
      'Reseller program with 75 % discount key generation and inventory tracking',
      'Ad spot rental marketplace — manage sponsored slots from the admin panel',
      'Subscriptions hub with auto-renew toggles per license',
    ],
  },
  {
    date:    'May 24, 2026',
    version: 'v2.3.0',
    tag:     'Security',
    items: [
      'License key storage moved to SHA-256 lookup hashes',
      'Brute-force protection — per-IP and per-key throttling',
      'New audit log captures every admin mutation with payload',
    ],
  },
  {
    date:    'May 17, 2026',
    version: 'v2.2.0',
    tag:     'Tools',
    items: [
      'Auto-update manifest endpoint live for all WPF tools',
      'SHA-256 binary integrity verification on every download',
      'Force-update flag per product version',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[64px]" style={{ background: 'var(--bg)' }}>
        <div className="container-x py-20 max-w-3xl">
          <span className="label-mono mb-4 block">Updates</span>
          <h1 className="text-[var(--fg)] mb-12" style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            lineHeight: 1,
            letterSpacing: '-0.035em',
            fontWeight: 500,
          }}>
            Changelog.
          </h1>

          <div className="flex flex-col gap-14">
            {entries.map(e => (
              <div key={e.version} className="grid grid-cols-12 gap-6">
                <div className="col-span-3 lg:col-span-3">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--c)]">{e.tag}</p>
                  <p className="font-mono text-[11px] text-[var(--fg-mute)] mt-1">{e.date}</p>
                </div>
                <div className="col-span-9 lg:col-span-9">
                  <h2 className="text-[var(--fg)] mb-4" style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '28px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    fontWeight: 400,
                  }}>
                    Onyx <span className="font-serif-i">{e.version}</span>
                  </h2>
                  <ul className="flex flex-col gap-2.5">
                    {e.items.map(it => (
                      <li key={it} className="flex gap-3 text-[14.5px] text-[var(--fg-dim)] leading-[1.6]">
                        <span className="text-[var(--fg-mute)] mt-0.5">—</span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
