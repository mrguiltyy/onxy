import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bell, Check, ChevronRight } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { relativeTime } from '@/lib/utils'
import { MarkAllReadButton } from './MarkAllReadButton'

export const metadata = { title: 'Notifications' }
export const dynamic = 'force-dynamic'

interface Notif {
  id:         string
  type:       string
  title:      string
  body:       string | null
  link_url:   string | null
  is_read:    boolean
  created_at: string
}

export default async function NotificationsPage() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifsRaw } = await supa
    .from('notifications')
    .select('id, type, title, body, link_url, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)
  const notifs = (notifsRaw as Notif[] | null) ?? []
  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div className="animate-in max-w-[760px]">
      <div className="mb-8 flex items-end justify-between gap-3">
        <div>
          <p className="label-mono mb-2">Inbox</p>
          <h1 className="text-[26px] font-bold tracking-tight">Notifications</h1>
          <p className="text-[14px] text-[var(--fg-dim)] mt-1">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      {notifs.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell size={32} className="mx-auto mb-3 text-[var(--fg-faint)]" />
          <p className="text-[14px] font-medium mb-1">No notifications yet</p>
          <p className="text-[12.5px] text-[var(--fg-dim)]">
            You&apos;ll see product updates, reseller approvals, ticket replies, and important account events here.
          </p>
        </div>
      ) : (
        <div className="card divide-y" style={{ borderColor: 'var(--hairline)' }}>
          {notifs.map(n => {
            const inner = (
              <div
                className="px-5 py-4 hover:bg-[var(--surface-2)] transition-colors cursor-pointer flex items-start gap-3"
                style={{ background: n.is_read ? 'transparent' : 'rgba(59,130,246,0.03)' }}
              >
                <span
                  className="w-8 h-8 rounded-md flex items-center justify-center mt-0.5 shrink-0"
                  style={{
                    background: n.is_read ? 'var(--surface-2)' : 'var(--brand-faint)',
                    color: n.is_read ? 'var(--fg-mute)' : 'var(--brand)',
                  }}
                >
                  <Bell size={13} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`font-semibold text-[13.5px] leading-snug flex-1 ${n.is_read ? 'text-[var(--fg-dim)]' : 'text-[var(--fg)]'}`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
                        NEW
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--fg-mute)] shrink-0">{relativeTime(n.created_at)}</span>
                  </div>
                  {n.body && (
                    <p className="text-[12.5px] text-[var(--fg-dim)] mt-0.5 leading-relaxed line-clamp-2 whitespace-pre-line">
                      {n.body}
                    </p>
                  )}
                </div>
                {n.link_url && <ChevronRight size={14} className="text-[var(--fg-mute)] mt-1.5 shrink-0" />}
              </div>
            )

            return n.link_url
              ? <Link key={n.id} href={n.link_url} style={{ borderColor: 'var(--hairline)' }}>{inner}</Link>
              : <div key={n.id} style={{ borderColor: 'var(--hairline)' }}>{inner}</div>
          })}
        </div>
      )}
    </div>
  )
}
