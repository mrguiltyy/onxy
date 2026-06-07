'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { User, Bell, LogOut, ChevronDown, Settings, Wallet, KeyRound, ShieldCheck, Sparkles } from 'lucide-react'

interface Props {
  username:      string
  email:         string
  balanceCents:  number
  avatarUrl?:    string | null
  isAdmin?:      boolean
}

export function UserMenu({ username, email, balanceCents, avatarUrl, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 border transition-colors hover:bg-[var(--surface-2)] hover:border-[var(--hairline-2)]"
        style={{ borderColor: 'var(--hairline)' }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold overflow-hidden shrink-0"
          style={{
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'var(--brand-gradient)',
            color: '#3a2630',
          }}
        >
          {!avatarUrl && (username[0]?.toUpperCase() ?? 'U')}
        </div>
        <span className="text-[13px] hidden sm:inline">{username}</span>
        <ChevronDown size={12} className="text-[var(--fg-mute)]" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[260px] rounded-md overflow-hidden shadow-2xl z-50"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Identity block */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--hairline)' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold overflow-hidden shrink-0"
                style={{
                  background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'var(--brand-gradient)',
                  color: '#3a2630',
                }}
              >
                {!avatarUrl && (username[0]?.toUpperCase() ?? 'U')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] truncate">{username}</p>
                <p className="text-[11px] text-[var(--fg-mute)] truncate font-mono">{email}</p>
              </div>
            </div>
            <div className="mt-3 px-2 py-1.5 rounded-md text-[11.5px] flex items-center justify-between"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
              <span className="text-[var(--fg-mute)]">Wallet</span>
              <span className="font-bold text-[var(--ok)] tabular-nums">
                ${(balanceCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <MenuItem href="/dashboard"            icon={<Sparkles size={12} />}   label="Dashboard" />
            <MenuItem href="/dashboard/account"    icon={<Settings size={12} />}   label="Account settings" />
            <MenuItem href="/dashboard/notifications" icon={<Bell size={12} />}    label="Notifications" />
            <MenuItem href="/dashboard/balance"    icon={<Wallet size={12} />}     label="Wallet &amp; top-up" />
            <MenuItem href="/dashboard/licenses"   icon={<KeyRound size={12} />}   label="My licenses" />
            {isAdmin && (
              <MenuItem href="/admin"              icon={<ShieldCheck size={12} />} label="Admin panel" accent />
            )}
          </div>

          {/* Sign out */}
          <div className="border-t" style={{ borderColor: 'var(--hairline)' }}>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full px-4 py-2.5 text-left text-[12.5px] text-[var(--bad)] hover:bg-[var(--surface-2)] inline-flex items-center gap-2.5 transition-colors"
              >
                <LogOut size={12} /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ href, icon, label, accent }: { href: string; icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-[12.5px] hover:bg-[var(--surface-2)] inline-flex items-center gap-2.5 w-full transition-colors"
      style={{ color: accent ? 'var(--brand)' : 'var(--fg-dim)' }}
    >
      <span style={{ color: accent ? 'var(--brand)' : 'var(--fg-mute)' }}>{icon}</span>
      <span dangerouslySetInnerHTML={{ __html: label }} />
    </Link>
  )
}
