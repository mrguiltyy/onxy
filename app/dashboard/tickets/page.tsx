import Link from 'next/link'
import { Plus, MessageSquare, Clock, Activity, Sparkles } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { relativeTime } from '@/lib/utils'

interface Ticket {
  id:            string
  subject:       string
  category:      string
  priority:      string
  status:        string
  last_reply_at: string
  created_at:    string
}

export default async function TicketsPage() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('tickets')
    .select('id, subject, category, priority, status, last_reply_at, created_at')
    .eq('user_id', user!.id)
    .order('last_reply_at', { ascending: false })

  const tickets = (data ?? []) as Ticket[]

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Support tickets</h1>
          <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">Get help from the Onyx team.</p>
        </div>
        <Link href="/dashboard/tickets/new" className="btn btn-primary btn-sm">
          <Plus size={14} /> New ticket
        </Link>
      </div>

      {/* Troubleshooter prompt — always visible above ticket list */}
      {tickets.length === 0 && (
        <div
          className="rounded-md p-5 mb-5 flex items-start gap-3"
          style={{
            background: 'radial-gradient(ellipse 600px 300px at 0% 0%, rgba(240,164,183,0.08), transparent 60%), var(--surface)',
            border: '1px solid var(--hairline)',
          }}
        >
          <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{
            background: 'var(--brand-gradient)', color: '#3a2630',
          }}>
            <Sparkles size={15} />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-[14px] mb-1">Try the auto-troubleshooter first</p>
            <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed mb-3">
              80% of common issues — HWID resets, invalid keys, rate limits — get fixed in &lt;30 seconds without opening a ticket. Run it before reaching for support.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/dashboard/troubleshoot" className="btn btn-primary btn-sm">
                <Activity size={11} /> Run troubleshooter
              </Link>
              <Link href="/faq" className="btn btn-secondary btn-sm">
                Browse FAQ
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {tickets.length === 0 ? (
          <div className="px-5 py-16 text-center max-w-[440px] mx-auto">
            <div className="w-12 h-12 mx-auto mb-4 rounded-md flex items-center justify-center"
              style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
              <MessageSquare size={20} />
            </div>
            <p className="text-[15px] font-semibold mb-1">No tickets yet</p>
            <p className="text-[12.5px] text-[var(--fg-dim)] mb-5 leading-relaxed">
              If the troubleshooter above can&apos;t solve your issue, open a ticket and a real person will get back to you.
            </p>
            <Link href="/dashboard/tickets/new" className="btn btn-secondary btn-sm inline-flex">
              <Plus size={11} /> Open a ticket
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--hairline)]">
            {tickets.map(t => (
              <Link
                key={t.id}
                href={`/dashboard/tickets/${t.id}`}
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
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[14px] font-semibold text-[var(--fg)] truncate">{t.subject}</p>
                      <StatusPill status={t.status} />
                    </div>
                    <div className="flex items-center gap-3 text-[11.5px] text-[var(--fg-mute)]">
                      <span className="capitalize">{t.category.replace(/_/g, ' ')}</span>
                      <span>·</span>
                      <span className="capitalize">{t.priority} priority</span>
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
