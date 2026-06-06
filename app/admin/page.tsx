import Link from 'next/link'
import { MessageSquare, Megaphone, Users, KeyRound, ArrowRight } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

export default async function AdminOverviewPage() {
  const db = supabaseAdmin()

  // Counts
  const [usersCount, ticketsOpen, licensesTotal, profilesRaw] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('tickets').select('*', { count: 'exact', head: true }).neq('status', 'closed'),
    db.from('licenses').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('balance_cents'),
  ])

  const totalBalance = ((profilesRaw.data ?? []) as { balance_cents: number }[])
    .reduce((s, p) => s + Number(p.balance_cents ?? 0), 0)

  const cards = [
    { label: 'Total users',   value: (usersCount.count    ?? 0).toString(),         href: '/admin/users',         icon: Users          },
    { label: 'Open tickets',  value: (ticketsOpen.count   ?? 0).toString(),         href: '/admin/tickets',       icon: MessageSquare  },
    { label: 'Licenses minted',value: (licensesTotal.count ?? 0).toString(),         href: '/admin/users',         icon: KeyRound       },
    { label: 'Total balance', value: formatPrice(totalBalance),                       href: '/admin/users',         icon: Megaphone      },
  ]

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight">Admin overview</h1>
        <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">Quick metrics and shortcuts.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <Link key={c.label} href={c.href} className="card card-hover p-5 group">
              <span
                className="w-8 h-8 rounded-md flex items-center justify-center mb-4"
                style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}
              >
                <Icon size={15} />
              </span>
              <p className="text-[24px] font-bold tabular-nums" style={{ letterSpacing: '-0.02em' }}>{c.value}</p>
              <p className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider mt-1">{c.label}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/admin/tickets" className="card card-hover p-5 flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
            <MessageSquare size={15} />
          </span>
          <span className="flex-1 text-[14px] font-semibold group-hover:text-[var(--brand)] transition-colors">Open ticket inbox</span>
          <ArrowRight size={14} className="text-[var(--fg-mute)] group-hover:text-[var(--brand)] transition-colors" />
        </Link>
        <Link href="/admin/announcements" className="card card-hover p-5 flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
            <Megaphone size={15} />
          </span>
          <span className="flex-1 text-[14px] font-semibold group-hover:text-[var(--brand)] transition-colors">Post announcement</span>
          <ArrowRight size={14} className="text-[var(--fg-mute)] group-hover:text-[var(--brand)] transition-colors" />
        </Link>
        <Link href="/admin/users" className="card card-hover p-5 flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
            <Users size={15} />
          </span>
          <span className="flex-1 text-[14px] font-semibold group-hover:text-[var(--brand)] transition-colors">Manage users</span>
          <ArrowRight size={14} className="text-[var(--fg-mute)] group-hover:text-[var(--brand)] transition-colors" />
        </Link>
      </div>
    </div>
  )
}
