'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, KeyRound, Plus, Wallet, User, ChevronDown, MessageSquare, Shield, Boxes, BookOpen, Store, LifeBuoy, Calendar } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { Logo } from './Logo'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { ProjectSelector } from './ProjectSelector'

interface Notif {
  id: string; type: string; title: string; body: string | null
  link_url: string | null; is_read: boolean; created_at: string
}

interface TopbarProps {
  username: string
  email?: string
  balanceCents: number
  isAdmin?: boolean
  canManageApps?: boolean
  avatarUrl?: string | null
  notifications?: Notif[]
  unreadCount?:   number
}

const baseTabs = [
  { href: '/dashboard',                icon: LayoutDashboard, label: 'Dashboard'     },
  { href: '/dashboard/subscriptions',  icon: Calendar,        label: 'Subscriptions' },
  { href: '/dashboard/licenses',       icon: KeyRound,        label: 'Licenses'      },
  { href: '/dashboard/generate',  icon: Plus,            label: 'Generate'  },
  { href: '/dashboard/balance',   icon: Wallet,          label: 'Top-up'    },
  { href: '/dashboard/troubleshoot', icon: LifeBuoy,     label: 'Help'      },
  { href: '/dashboard/tickets',   icon: MessageSquare,   label: 'Tickets'   },
  { href: '/dashboard/account',   icon: User,            label: 'Account'   },
]

const resellerTabs = [
  { href: '/dashboard/applications', icon: Boxes,    label: 'Applications' },
  { href: '/dashboard/resells',      icon: Store,    label: 'My resells'   },
  { href: '/dashboard/api-docs',     icon: BookOpen, label: 'API docs'     },
]

export function Topbar({ username, email, balanceCents, isAdmin, canManageApps, avatarUrl, notifications = [], unreadCount = 0 }: TopbarProps) {
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
            <Logo size="sm" href="/dashboard" />
          </div>

          {/* Project picker (resellers + admins; just visual for now) */}
          {canManageApps && (
            <div className="hidden md:flex items-center mx-3">
              <ProjectSelector />
            </div>
          )}

          {/* Tabs */}
          <nav className="flex items-center gap-2 overflow-x-auto flex-1 md:flex-initial justify-center scrollbar-none">
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
            <UserMenu
              username={username}
              email={email ?? ''}
              balanceCents={balanceCents}
              avatarUrl={avatarUrl}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
