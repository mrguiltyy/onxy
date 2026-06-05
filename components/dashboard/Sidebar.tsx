'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Wallet, Ticket, Users2, ShieldCheck, LogOut, ChevronRight, Home, Gift, RefreshCw, Sparkles, Key } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'

interface SidebarProps {
  username: string
  email:    string
  role:     'user' | 'reseller'
}

const navMain = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'Overview'      },
  { href: '/dashboard/library',      icon: Package,         label: 'My Library'    },
  { href: '/dashboard/subscriptions',icon: RefreshCw,       label: 'Subscriptions' },
  { href: '/dashboard/wallet',       icon: Wallet,          label: 'Wallet'        },
  { href: '/dashboard/redeem',       icon: Gift,            label: 'Redeem Code'   },
  { href: '/dashboard/tickets',      icon: Ticket,          label: 'Support'       },
  { href: '/dashboard/referrals',    icon: Users2,          label: 'Referrals'     },
  { href: '/dashboard/security',     icon: ShieldCheck,     label: 'Security'      },
]

const navReseller = [
  { href: '/dashboard/reseller',           icon: Sparkles, label: 'Hub'        },
  { href: '/dashboard/reseller/generate',  icon: Key,      label: 'Generate'   },
  { href: '/dashboard/reseller/inventory', icon: Package,  label: 'Inventory'  },
]

export function Sidebar({ username, email, role }: SidebarProps) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] z-30 flex flex-col border-r border-[var(--hairline)] bg-[var(--bg)]">

      <div className="px-5 py-5 border-b border-[var(--hairline)]">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="text-[15px] font-medium tracking-tight text-[var(--fg)]">Onyx</span>
          <span className="font-mono text-[10.5px] text-[var(--fg-mute)] tracking-[0.18em] uppercase">Services</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-faint)] px-2 mb-2">Dashboard</p>
        {navMain.map(item => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href} className={cn('nav-item', active && 'active')}>
              <Icon size={15} strokeWidth={active ? 2 : 1.75} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={12} className="opacity-60" />}
            </Link>
          )
        })}

        {role === 'reseller' && (
          <>
            <div className="mt-4 mb-1.5 mx-2 h-px bg-[var(--hairline)]" />
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--c)]">Reseller</p>
              <Sparkles size={9} className="text-[var(--c)]" />
            </div>
            {navReseller.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href} className={cn('nav-item', active && 'active')}>
                  <Icon size={15} strokeWidth={active ? 2 : 1.75} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight size={12} className="opacity-60" />}
                </Link>
              )
            })}
          </>
        )}

        <div className="mt-4 mb-1.5 mx-2 h-px bg-[var(--hairline)]" />
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-faint)] px-2 mb-2">General</p>
        <Link href="/" className="nav-item"><Home size={15} /><span>Back to Site</span></Link>
        <Link href="/shop" className="nav-item"><Package size={15} /><span>Browse Products</span></Link>
      </nav>

      <div className="px-3 py-4 border-t border-[var(--hairline)]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-[var(--surface)] border border-[var(--hairline)] mb-2">
          <Avatar name={username} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-[var(--fg)] text-[13px] font-semibold truncate">{username}</p>
            <p className="text-[var(--fg-mute)] text-[10.5px] truncate">{email}</p>
          </div>
        </div>
        <form action="/auth/sign-out" method="POST">
          <button type="submit" className="nav-item w-full text-[var(--bad)] hover:bg-[rgba(255,91,117,0.05)] hover:text-[var(--bad)]">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
