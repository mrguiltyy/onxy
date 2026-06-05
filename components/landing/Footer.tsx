import Link from 'next/link'

const cols = {
  Arsenal: [
    { href: '/shop',            label: 'All products' },
    { href: '/shop?cat=auto',   label: 'Automation'   },
    { href: '/shop?cat=stealth',label: 'Stealth'      },
    { href: '/shop?cat=premium',label: 'Premium'      },
  ],
  Platform: [
    { href: '/status',   label: 'System status' },
    { href: '/changelog',label: 'Changelog'     },
    { href: '/dashboard/tickets', label: 'Contact' },
  ],
  Account: [
    { href: '/dashboard',         label: 'Dashboard' },
    { href: '/dashboard/library', label: 'Library'   },
    { href: '/dashboard/wallet',  label: 'Wallet'    },
    { href: '/dashboard/tickets', label: 'Support'   },
  ],
  Legal: [
    { href: '/terms',   label: 'Terms'   },
    { href: '/privacy', label: 'Privacy' },
    { href: '/refunds', label: 'Refunds' },
  ],
}

export function Footer() {
  return (
    <footer style={{ padding: '5rem 0 3rem' }} className="bg-[var(--bg)]">
      <div className="container-x">

        <div className="grid grid-cols-12 gap-8 lg:gap-12 mb-20">

          {/* Brand block */}
          <div className="col-span-12 lg:col-span-5">
            <Link href="/" className="group flex items-baseline gap-2 mb-6">
              <span className="text-[15px] font-medium tracking-tight text-[var(--fg)]">Onyx</span>
              <span className="font-mono text-[10.5px] text-[var(--fg-mute)] tracking-[0.18em] uppercase">Services</span>
            </Link>

            <p className="text-[var(--fg-dim)] mb-8 max-w-[400px]" style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '21px',
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
            }}>
              A private outfit for purpose-built software, used by operators who can&apos;t afford a leak.
            </p>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ok)' }} />
              <span className="label-mono">All systems operational</span>
            </div>
          </div>

          {Object.entries(cols).map(([title, items]) => (
            <div key={title} className="col-span-6 lg:col-span-2">
              <span className="label-mono mb-5 block">{title}</span>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rule mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="label-mono text-[var(--fg-faint)]">
            © {new Date().getFullYear()} Onyx Services
          </p>
          <p className="label-mono text-[var(--fg-faint)]">
            Unauthorized redistribution = permanent termination
          </p>
        </div>
      </div>
    </footer>
  )
}
