'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, KeyRound, Plus, Wallet, User, ChevronDown } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { Brand } from './Brand'

interface TopbarProps {
  username: string
  balanceCents: number
}

const tabs = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/licenses',  icon: KeyRound,        label: 'Licenses'  },
  { href: '/dashboard/generate',  icon: Plus,            label: 'Generate'  },
  { href: '/dashboard/balance',   icon: Wallet,          label: 'Top-up Balance' },
  { href: '/dashboard/account',   icon: User,            label: 'Account'   },
]

export function Topbar({ username, balanceCents }: TopbarProps) {
  const pathname = usePathname()

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: 'rgba(10, 13, 20, 0.85)',
        borderColor: 'var(--hairline)',
        backdropFilter: 'blur(14px) saturate(180%)',
        WebkitBackdropFilter: 'blur(14px) saturate(180%)',
      }}
    >
      <div className="container-x">
        <div className="flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="py-3 shrink-0">
            <Brand size="md" href="/dashboard" withStatus />
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-2 overflow-x-auto flex-1 justify-center scrollbar-none">
            {tabs.map(t => {
              const Icon = t.icon
              const active =
                t.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(t.href)
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn('nav-tab', active && 'active')}
                >
                  <Icon size={15} />
                  <span className="whitespace-nowrap">{t.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Balance + user chip */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] text-[var(--fg-mute)] uppercase tracking-wider">Balance</span>
              <span className="text-[14px] text-[var(--ok)] font-bold tabular-nums leading-tight">
                {formatPrice(balanceCents)}
              </span>
            </div>
            <Link
              href="/dashboard/account"
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 border border-[var(--hairline)] hover:bg-[var(--surface-2)] hover:border-[var(--hairline-2)] transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
              >
                {username[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="text-[13px] text-[var(--fg)] hidden sm:inline">{username}</span>
              <ChevronDown size={13} className="text-[var(--fg-mute)]" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
