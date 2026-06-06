import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { relativeTime, formatDate } from '@/lib/utils'
import { ReplyBox } from './ReplyBox'

interface Ticket {
  id:         string
  user_id:    string
  subject:    string
  category:   string
  priority:   string
  status:     string
  created_at: string
}

interface Message {
  id:          string
  author_id:   string
  is_admin:    boolean
  is_internal: boolean
  body:        string
  created_at:  string
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ticketRaw } = await supabase
    .from('tickets')
    .select('id, user_id, subject, category, priority, status, created_at')
    .eq('id', id)
    .single()

  const ticket = (ticketRaw ?? null) as Ticket | null
  if (!ticket) notFound()

  const { data: msgsRaw } = await supabase
    .from('ticket_messages')
    .select('id, author_id, is_admin, is_internal, body, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  const messages = (msgsRaw ?? []) as Message[]

  return (
    <div className="animate-in max-w-[820px]">
      <Link href="/dashboard/tickets" className="inline-flex items-center gap-1.5 text-[var(--fg-dim)] hover:text-[var(--fg)] text-sm mb-4 transition-colors">
        <ArrowLeft size={14} /> Back to tickets
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <StatusPill status={ticket.status} />
          <span className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider capitalize">{ticket.category.replace(/_/g, ' ')}</span>
          <span className="text-[var(--fg-mute)]">·</span>
          <span className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider capitalize">{ticket.priority} priority</span>
        </div>
        <h1 className="text-[22px] font-bold tracking-tight">{ticket.subject}</h1>
        <p className="text-[12px] text-[var(--fg-mute)] mt-1">Opened {formatDate(ticket.created_at)}</p>
      </div>

      {/* Thread */}
      <div className="flex flex-col gap-3 mb-6">
        {messages.map(m => (
          <div
            key={m.id}
            className="card p-5"
            style={m.is_admin ? { borderColor: 'rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.04)' } : undefined}
          >
            <div className="flex items-center gap-2 mb-3">
              {m.is_admin ? (
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}
                >
                  <Shield size={13} />
                </span>
              ) : (
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                >
                  Y
                </span>
              )}
              <span className="text-[13px] font-semibold">{m.is_admin ? 'Onyx Support' : 'You'}</span>
              {m.is_admin && <Pill tone="brand">Staff</Pill>}
              <span className="text-[11px] text-[var(--fg-mute)] ml-1">{relativeTime(m.created_at)}</span>
            </div>
            <p className="text-[14px] text-[var(--fg)] whitespace-pre-wrap leading-relaxed pl-9">{m.body}</p>
          </div>
        ))}
      </div>

      {/* Reply box (only if not closed) */}
      {ticket.status !== 'closed' ? (
        <ReplyBox ticketId={ticket.id} />
      ) : (
        <div className="card p-5 text-center">
          <p className="text-[13.5px] text-[var(--fg-dim)]">
            This ticket is closed. Open a new one if you still need help.
          </p>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === 'open')    return <Pill tone="brand">Open</Pill>
  if (status === 'replied') return <Pill tone="ok">Replied</Pill>
  return <Pill tone="warn">Closed</Pill>
}
