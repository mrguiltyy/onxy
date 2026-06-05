'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Package, ShoppingCart, Key, Ticket, BarChart3, Tag, Megaphone, ClipboardList, Globe, LogOut, ChevronRight, Shield, Gift, Sparkles, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/admin',              icon: LayoutDashboard, label: 'Overview'      },
  { href: '/admin/analytics',    icon: BarChart3,       label: 'Analytics'     },
  { href: '/admin/users',        icon: Users,           label: 'Users'         },
  { href: '/admin/resellers',    icon: Sparkles,        label: 'Resellers'     },
  { href: '/admin/products',     icon: Package,         label: 'Products'      },
  { href: '/admin/categories',   icon: Tag,             label: 'Categories'    },
  { href: '/admin/licenses',     icon: Key,             label: 'Licenses'      },
  { href: '/admin/orders',       icon: ShoppingCart,    label: 'Orders'        },
  { href: '/admin/tickets',      icon: Ticket,          label: 'Tickets'       },
  { href: '/admin/coupons',      icon: Tag,             label: 'Coupons'       },
  { href: '/admin/redeem-codes', icon: Gift,            label: 'Redeem Codes'  },
  { href: '/admin/announcements',icon: Megaphone,       label: 'Announcements' },
  { href: '/admin/ad-spots',     icon: Image,           label: 'Ad Spots'      },
  { href: '/admin/audit-log',    icon: ClipboardList,   label: 'Audit Log'     },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] z-30 flex flex-col border-r border-white/[0.04] bg-[#08080d]">
      <div className="px-5 py-5 border-b border-white/[0.04]">
        <Link href="/" className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff3a00] to-[#cc2e00] flex items-center justify-center font-black text-[#0a0d14] text-sm">O</div>
          <div>
            <p className="text-white font-bold text-[14px] leading-none tracking-tight">Onyx Admin</p>
            <p className="text-[#6b7280] text-[10px] mt-1">Control Panel</p>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 bg-[rgba(255,91,117,0.06)] border border-[rgba(255,91,117,0.15)] rounded-md px-2.5 py-1.5">
          <Shield size={10} className="text-[#ff5b75]" />
          <span className="text-[10px] text-[#ff5b75] font-semibold tracking-wider">SUPER ADMIN</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#4b5563] px-2 mb-2">Management</p>
        {nav.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={cn('nav-item', active && 'active')}>
              <Icon size={14} strokeWidth={active ? 2 : 1.75} />
              <span className="flex-1 text-[13.5px]">{item.label}</span>
              {active && <ChevronRight size={11} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.04]">
        <Link href="/dashboard" className="nav-item mb-1"><Globe size={14} /><span>View Site</span></Link>
        <button className="nav-item w-full text-[#ff5b75] hover:bg-[rgba(255,91,117,0.05)] hover:text-[#ff5b75]">
          <LogOut size={14} /><span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
