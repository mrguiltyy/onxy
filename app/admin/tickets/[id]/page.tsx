import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, User } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { relativeTime, formatDate } from '@/lib/utils'
import { AdminReplyBox } from './AdminReplyBox'

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

interface Profile {
  username: string
  email:    string
  role:     string
}

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = supabaseAdmin()

  const { data: ticketRaw } = await db
    .from('tickets')
    .select('id, user_id, subject, category, priority, status, created_at')
    .eq('id', id)
    .single()

  const ticket = (ticketRaw ?? null) as Ticket | null
  if (!ticket) notFound()

  const [{ data: msgsRaw }, { data: profileRaw }] = await Promise.all([
    db.from('ticket_messages')
      .select('id, author_id, is_admin, is_internal, body, created_at')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true }),
    db.from('profiles')
      .select('username, email, role')
      .eq('id', ticket.user_id)
      .single(),
  ])

  const messages = (msgsRaw ?? []) as Message[]
  const customer = (profileRaw ?? null) as Profile | null

  return (
    <div className="animate-in max-w-[920px]">
      <Link href="/admin/tickets" className="inline-flex items-center gap-1.5 text-[var(--fg-dim)] hover:text-[var(--fg)] text-sm mb-4 transition-colors">
        <ArrowLeft size={14} /> Back to inbox
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Thread */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusPill status={ticket.status} />
              <PriorityPill priority={ticket.priority} />
              <span className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider capitalize">{ticket.category.replace(/_/g, ' ')}</span>
            </div>
            <h1 className="text-[22px] font-bold tracking-tight">{ticket.subject}</h1>
            <p className="text-[12px] text-[var(--fg-mute)] mt-1">Opened {formatDate(ticket.created_at)}</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {messages.map(m => (
              <div
                key={m.id}
                className="card p-5"
                style={
                  m.is_internal
                    ? { borderColor: 'rgba(250,204,21,0.30)', background: 'rgba(250,204,21,0.04)' }
                    : m.is_admin
                      ? { borderColor: 'rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.04)' }
                      : undefined
                }
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {m.is_admin ? (
                    <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
                      <Shield size={13} />
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                      <User size={13} />
                    </span>
                  )}
                  <span className="text-[13px] font-semibold">{m.is_admin ? 'Onyx Support' : customer?.username ?? 'Customer'}</span>
                  {m.is_admin && <Pill tone="brand">Staff</Pill>}
                  {m.is_internal && <Pill tone="warn">Internal note</Pill>}
                  <span className="text-[11px] text-[var(--fg-mute)] ml-1">{relativeTime(m.created_at)}</span>
                </div>
                <p className="text-[14px] text-[var(--fg)] whitespace-pre-wrap leading-relaxed pl-9">{m.body}</p>
              </div>
            ))}
          </div>

          <AdminReplyBox
            ticketId={ticket.id}
            customerEmail={customer?.email ?? ''}
            customerName={customer?.username ?? 'there'}
            subject={ticket.subject}
            status={ticket.status}
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <p className="label-mono mb-3">Customer</p>
            <p className="text-[14px] font-semibold">{customer?.username ?? '—'}</p>
            <p className="text-[12px] text-[var(--fg-dim)] mt-0.5">{customer?.email ?? '—'}</p>
            <Pill tone="brand" className="mt-3">{customer?.role ?? 'user'}</Pill>
          </div>
        </div>
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
  if (priority === 'medium') return <Pill tone="pend">Medium</Pill>
  return <Pill tone="brand">Low</Pill>
}
