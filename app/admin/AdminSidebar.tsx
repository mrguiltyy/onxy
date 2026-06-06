'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Megaphone, Users, Boxes, Handshake, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/admin',                icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/products',       icon: Boxes,           label: 'Products' },
  { href: '/admin/resellers',      icon: Handshake,       label: 'Resellers' },
  { href: '/admin/tickets',        icon: MessageSquare,   label: 'Tickets'  },
  { href: '/admin/pages',          icon: FileText,        label: 'Pages / Blog' },
  { href: '/admin/announcements',  icon: Megaphone,       label: 'Announcements' },
  { href: '/admin/users',          icon: Users,           label: 'Users'    },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside
      className="hidden md:block w-[200px] shrink-0 border-r"
      style={{ borderColor: 'var(--hairline)', background: 'rgba(13,17,26,0.4)' }}
    >
      <nav className="py-6 px-3 flex flex-col gap-0.5 sticky top-[64px]">
        <p className="label-mono px-3 mb-2">Admin</p>
        {items.map(item => {
          const Icon = item.icon
          const active = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] font-medium transition-colors',
                active
                  ? 'text-[var(--brand)]'
                  : 'text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]',
              )}
              style={active ? { background: 'var(--brand-faint)' } : undefined}
            >
              <Icon size={14} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
