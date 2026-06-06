'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, Check, X } from 'lucide-react'
import { markAllRead, markOneRead } from '@/app/dashboard/notifications/actions'

interface Notif {
  id:         string
  type:       string
  title:      string
  body:       string | null
  link_url:   string | null
  is_read:    boolean
  created_at: string
}

interface Props { initial: Notif[]; unreadCount: number }

export function NotificationBell({ initial, unreadCount: initialUnread }: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(initial)
  const [unread, setUnread] = useState(initialUnread)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function markAllAsRead() {
    setUnread(0)
    setItems(items.map(i => ({ ...i, is_read: true })))
    await markAllRead()
  }

  async function readOne(id: string) {
    setItems(items.map(i => i.id === id ? { ...i, is_read: true } : i))
    setUnread(u => Math.max(0, u - 1))
    await markOneRead(id)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative px-2 py-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors text-[var(--fg-dim)]"
        aria-label="Notifications"
      >
        <Bell size={15} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center px-1 tabular-nums"
            style={{ background: 'var(--brand)', color: '#0a0d14' }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[360px] rounded-md overflow-hidden shadow-2xl z-50"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--hairline)' }}>
            <p className="font-semibold text-[13px]">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllAsRead} className="text-[11.5px] text-[var(--brand)] hover:underline inline-flex items-center gap-1">
                <Check size={11} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-[12.5px] text-[var(--fg-mute)]">No notifications yet.</p>
            ) : items.map(n => (
              <NotifRow key={n.id} n={n} onRead={() => readOne(n.id)} />
            ))}
          </div>

          <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: 'var(--hairline)' }}>
            <Link href="/dashboard/notifications" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)]">
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function NotifRow({ n, onRead }: { n: Notif; onRead: () => void }) {
  const time = new Date(n.created_at)
  const ago = relative(time)

  const inner = (
    <div
      className="px-4 py-3 border-b cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
      style={{
        borderColor: 'var(--hairline)',
        background: n.is_read ? 'transparent' : 'var(--brand-faint)',
      }}
      onClick={!n.is_read ? onRead : undefined}
    >
      <div className="flex items-start gap-2 mb-0.5">
        {!n.is_read && (
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--brand)' }} />
        )}
        <p className={`text-[12.5px] font-semibold leading-snug flex-1 ${n.is_read ? 'text-[var(--fg-dim)]' : 'text-[var(--fg)]'}`}>
          {n.title}
        </p>
        <span className="text-[10px] text-[var(--fg-mute)] shrink-0 ml-1">{ago}</span>
      </div>
      {n.body && (
        <p className="text-[11.5px] text-[var(--fg-dim)] line-clamp-2 ml-3.5 leading-snug">{n.body}</p>
      )}
    </div>
  )

  return n.link_url ? <Link href={n.link_url}>{inner}</Link> : inner
}

function relative(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60)     return `${s}s`
  if (s < 3600)   return `${Math.floor(s/60)}m`
  if (s < 86400)  return `${Math.floor(s/3600)}h`
  return `${Math.floor(s/86400)}d`
}
