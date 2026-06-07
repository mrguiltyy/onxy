'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, KeyRound, Plus, Wallet, User, ChevronDown, MessageSquare, Shield, Boxes, BookOpen, Store, LifeBuoy } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { BrandRow } from './Brand'
import { NotificationBell } from './NotificationBell'

interface Notif {
  id: string; type: string; title: string; body: string | null
  link_url: string | null; is_read: boolean; created_at: string
}

interface TopbarProps {
  username: string
  balanceCents: number
  isAdmin?: boolean
  canManageApps?: boolean
  avatarUrl?: string | null
  notifications?: Notif[]
  unreadCount?:   number
}

const baseTabs = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/licenses',  icon: KeyRound,        label: 'Licenses'  },
  { href: '/dashboard/generate',  icon: Plus,            label: 'Generate'  },
  { href: '/dashboard/balance',   icon: Wallet,          label: 'Top-up'    },
  { href: '/dashboard/troubleshoot', icon: LifeBuoy,     label: 'Help'      },
  { href: '/dashboard/tickets',   icon: MessageSquare,   label: 'Tickets'   },
  { href: '/dashboard/account',   icon: User,            label: 'Account'   },
]

const resellerTabs = [
  { href: '/dashboard/applications', icon: Boxes,    label: 'Applications' },
  { href: '/dashboard/resells',      icon: Store,    label: 'My resells'   },
  { href: '/dashboard/docs',         icon: BookOpen, label: 'Docs'         },
]

export function Topbar({ username, balanceCents, isAdmin, canManageApps, avatarUrl, notifications = [], unreadCount = 0 }: TopbarProps) {
  const pathname = usePathname()
  const tabs = canManageApps
    ? [...baseTabs.slice(0, 4), ...resellerTabs, ...baseTabs.slice(4)]
    : baseTabs

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
            <BrandRow href="/dashboard" />
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
            <NotificationBell initial={notifications} unreadCount={unreadCount} />
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
                style={{
                  background: 'var(--brand-faint)',
                  color: 'var(--brand)',
                  border: '1px solid rgba(59,130,246,0.25)',
                }}
              >
                <Shield size={11} />
                Admin
              </Link>
            )}
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
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold overflow-hidden"
                style={{
                  background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'var(--brand-gradient)',
                  color: '#3a2630',
                }}
              >
                {!avatarUrl && (username[0]?.toUpperCase() ?? 'U')}
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
