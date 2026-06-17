'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, KeyRound, Plus, Wallet, User, MessageSquare, Shield, Boxes, BookOpen, Store, LifeBuoy, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  { href: '/dashboard/licenses',       icon: KeyRound,        label: 'Licenses'      },
  { href: '/dashboard/subscriptions',  icon: Calendar,        label: 'Subscriptions' },
  { href: '/dashboard/generate',       icon: Plus,            label: 'Generate'      },
  { href: '/dashboard/balance',        icon: Wallet,          label: 'Top-up'        },
]

const resellerTabs = [
  { href: '/dashboard/applications', icon: Boxes,    label: 'Applications' },
  { href: '/dashboard/resells',      icon: Store,    label: 'My resells'   },
  { href: '/dashboard/api-docs',     icon: BookOpen, label: 'API docs'     },
]

const utilityTabs = [
  { href: '/dashboard/tickets',      icon: MessageSquare,   label: 'Tickets' },
  { href: '/dashboard/troubleshoot', icon: LifeBuoy,        label: 'Help'    },
  { href: '/dashboard/account',      icon: User,            label: 'Account' },
]

export function Topbar({ username, email, balanceCents, isAdmin, canManageApps, avatarUrl, notifications = [], unreadCount = 0 }: TopbarProps) {
  const pathname = usePathname()
  const tabs = canManageApps
    ? [...baseTabs, ...resellerTabs, ...utilityTabs]
    : [...baseTabs, ...utilityTabs]

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(10, 13, 20, 0.88)',
        backdropFilter: 'blur(18px) saturate(180%)',
        WebkitBackdropFilter: 'blur(18px) saturate(180%)',
        borderBottom: '1px solid var(--hairline)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
      }}
    >
      {/* ── ROW 1 — Brand · Project · Search · Bell · Admin · User ─── */}
      <div className="container-x">
        <div className="flex items-center justify-between gap-3 py-3">

          <div className="flex items-center gap-4 min-w-0">
            <Logo size="sm" href="/dashboard" />
            {canManageApps && (
              <>
                <span className="hidden md:block w-px h-6" style={{ background: 'var(--hairline)' }} />
                <div className="hidden md:flex items-center">
                  <ProjectSelector />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell initial={notifications} unreadCount={unreadCount} />
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-colors hover:opacity-90"
                style={{
                  background: 'var(--brand-faint)',
                  color: 'var(--brand)',
                  border: '1px solid rgba(240,164,183,0.30)',
                }}
              >
                <Shield size={11} /> Admin
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

      {/* ── ROW 2 — Nav tabs (scrollable on overflow) ────────────── */}
      <div
        className="border-t"
        style={{ borderColor: 'var(--hairline)' }}
      >
        <div className="container-x">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-2 px-2">
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
                  className={cn('relative inline-flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-semibold whitespace-nowrap transition-colors shrink-0', active ? 'text-[var(--fg)]' : 'text-[var(--fg-dim)] hover:text-[var(--fg)]')}
                  style={{ letterSpacing: '-0.01em' }}
                >
                  <Icon size={13} strokeWidth={2.2} />
                  {t.label}
                  {active && (
                    <span
                      className="absolute left-3 right-3 bottom-0 h-[2px] rounded-t"
                      style={{ background: 'var(--brand)' }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
