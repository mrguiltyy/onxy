import Link from 'next/link'
import { MessageSquare, Clock } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { relativeTime } from '@/lib/utils'

interface TicketRow {
  id:            string
  subject:       string
  category:      string
  priority:      string
  status:        string
  last_reply_at: string
  user_id:       string
  profiles:      { username: string; email: string } | null
}

export default async function AdminTicketsPage() {
  const db = supabaseAdmin()

  const { data } = await db
    .from('tickets')
    .select('id, subject, category, priority, status, last_reply_at, user_id, profiles(username, email)')
    .order('last_reply_at', { ascending: false })
    .limit(100)

  const tickets = (data ?? []) as unknown as TicketRow[]

  const counts = {
    open:    tickets.filter(t => t.status === 'open').length,
    replied: tickets.filter(t => t.status === 'replied').length,
    closed:  tickets.filter(t => t.status === 'closed').length,
  }

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Support inbox</h1>
          <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">All customer tickets.</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="brand">{counts.open} Open</Pill>
          <Pill tone="ok">{counts.replied} Replied</Pill>
          <Pill tone="warn">{counts.closed} Closed</Pill>
        </div>
      </div>

      <div className="card overflow-hidden">
        {tickets.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="empty-mark"><MessageSquare size={20} /></div>
            <p className="text-[15px] font-medium mb-1">No tickets yet</p>
            <p className="text-[13px] text-[var(--fg-dim)]">Open tickets show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--hairline)]">
            {tickets.map(t => (
              <Link
                key={t.id}
                href={`/admin/tickets/${t.id}`}
                className="block px-5 py-4 hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}
                  >
                    <MessageSquare size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-[14px] font-semibold text-[var(--fg)] truncate">{t.subject}</p>
                      <StatusPill status={t.status} />
                      <PriorityPill priority={t.priority} />
                    </div>
                    <div className="flex items-center gap-3 text-[11.5px] text-[var(--fg-mute)]">
                      <span>{t.profiles?.username ?? '—'}</span>
                      <span>·</span>
                      <span className="capitalize">{t.category.replace(/_/g, ' ')}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1"><Clock size={10} /> {relativeTime(t.last_reply_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === 'open')    return <Pill tone="brand">Open</Pill>
  if (status === 'replied') return <Pill tone="ok">Replied</Pill>
  return <Pill tone="warn">Closed</Pill>
}

function PriorityPill({ priority }: { priority: string }) {
  if (priority === 'high')   return <Pill tone="bad">High</Pill>
  if (priority === 'medium') return <Pill tone="pend">Med</Pill>
  return <Pill tone="brand">Low</Pill>
}
