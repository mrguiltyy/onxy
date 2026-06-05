'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Book, Shield, Cpu, RefreshCw, Code, AlertTriangle, KeyRound, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'

const sections = [
  {
    label: 'Getting Started',
    items: [
      { href: '/docs',                  icon: Book,          label: 'Introduction' },
      { href: '/docs/quickstart',       icon: Code,          label: 'Quick Start' },
    ],
  },
  {
    label: 'Authentication',
    items: [
      { href: '/docs/authentication',   icon: KeyRound,      label: 'Auth Flow' },
      { href: '/docs/hwid',             icon: Cpu,           label: 'HWID Binding' },
      { href: '/docs/heartbeat',        icon: Shield,        label: 'Heartbeat' },
    ],
  },
  {
    label: 'Features',
    items: [
      { href: '/docs/auto-update',      icon: RefreshCw,     label: 'Auto-Update' },
      { href: '/docs/redeem-codes',     icon: Gift,          label: 'Redeem Codes' },
      { href: '/docs/error-handling',   icon: AlertTriangle, label: 'Error Handling' },
    ],
  },
  {
    label: 'Integration',
    items: [
      { href: '/docs/wpf-integration',  icon: Code,          label: 'WPF (C#)' },
    ],
  },
]

export function DocsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-[68px] bottom-0 w-[260px] z-20 flex flex-col border-r border-white/[0.04] bg-[#0a0d14] overflow-y-auto">
      <div className="p-5">
        <div className="relative mb-5">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input type="search" placeholder="Search docs..." className="input-onyx pl-9 !py-2 text-[13px]" />
        </div>

        {sections.map(section => (
          <div key={section.label} className="mb-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#4b5563] px-2 mb-2">{section.label}</p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(item => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} className={cn('nav-item', active && 'active')}>
                    <Icon size={13} strokeWidth={active ? 2 : 1.75} />
                    <span className="text-[13px]">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
