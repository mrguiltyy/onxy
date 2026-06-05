'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Send, Eye, Lock, AlertCircle, User, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'

const ticket = {
  id:        'TKT-0042',
  subject:   'HWID reset request — new PC build',
  category:  'HWID Reset',
  priority:  'medium',
  status:    'open',
  user:      { username: 'DarkByte', email: 'darkbyte@example.com', joined: 'May 1, 2026', tier: 'Gold' },
  opened:    'Jun 1, 2026 · 2h ago',
  messages: [
    { id: 'm1', author: 'DarkByte',  is_admin: false, body: 'Hey — just built a new rig and need to reset my HWID slot for Onyx Rage. Old PC is gone for good, no point keeping the slot. Thanks.', at: '2h ago' },
    { id: 'm2', author: 'You',       is_admin: true,  body: 'Hi DarkByte — got it. I\'ll free up that slot now. You\'ll be able to re-register on next launch.', at: '1h ago' },
    { id: 'm3', author: 'DarkByte',  is_admin: false, body: 'Perfect, just confirmed it worked. Thanks!', at: '30m ago' },
  ],
}

export default function AdminTicketDetailPage() {
  const { toast } = useToast()
  const [reply, setReply]         = useState('')
  const [internal, setInternal]   = useState(false)
  const [status, setStatus]       = useState(ticket.status)
  const [priority, setPriority]   = useState(ticket.priority)

  const send = () => {
    if (!reply.trim()) return
    toast({ title: internal ? 'Internal note saved' : 'Reply sent', variant: 'success' })
    setReply(''); setInternal(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/admin/tickets" className="inline-flex items-center gap-1 text-[var(--fg-mute)] hover:text-[var(--fg)] text-sm mb-4 transition-colors">
        <ChevronLeft size={14} /> Back to inbox
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Main thread ─── */}
        <div className="lg:col-span-2">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] text-[var(--fg-mute)]">{ticket.id}</span>
              <span className="status status-mute">{ticket.category}</span>
              <StatusBadge tone={status === 'open' ? 'cyan' : status === 'in_progress' ? 'warn' : 'mute'} dot>
                {status === 'open' ? 'Open' : status === 'in_progress' ? 'In Progress' : 'Closed'}
              </StatusBadge>
            </div>
            <h1 className="text-white font-bold text-2xl tracking-tight mb-1" style={{ letterSpacing: '-0.02em' }}>
              {ticket.subject}
            </h1>
            <p className="text-[var(--fg-mute)] text-xs">Opened {ticket.opened}</p>
          </div>

          {/* Message thread */}
          <div className="flex flex-col gap-4 mb-6">
            {ticket.messages.map(m => (
              <Card key={m.id} className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  {m.is_admin ? (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'var(--c-faint)', border: '1px solid var(--c-dim)' }}
                    >
                      <Shield size={14} className="text-[var(--c)]" />
                    </div>
                  ) : (
                    <Avatar name={m.author} size="md" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--fg)] font-semibold text-[14px]">{m.author}</span>
                      {m.is_admin && <span className="status status-cyan text-[9px]">Staff</span>}
                    </div>
                    <p className="text-[var(--fg-mute)] text-[11px]">{m.at}</p>
                  </div>
                </div>
                <p className="text-[var(--fg-dim)] text-[14px] leading-[1.6] pl-12">{m.body}</p>
              </Card>
            ))}
          </div>

          {/* Reply box */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[var(--fg)] font-semibold text-sm">Reply</p>
              <Switch
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
                label="Internal note"
                description="Hidden from the customer"
              />
            </div>
            <Textarea
              rows={5}
              placeholder={internal ? 'Internal note (only visible to staff)...' : 'Type your reply...'}
              value={reply}
              onChange={e => setReply(e.target.value)}
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10.5px] text-[var(--fg-mute)] flex items-center gap-1.5">
                {internal ? <><Lock size={11} /> Note will not be emailed to the customer.</> : <><Eye size={11} /> Customer will receive an email notification.</>}
              </p>
              <Button variant="primary" icon={<Send size={13} />} onClick={send} disabled={!reply.trim()}>
                {internal ? 'Save Note' : 'Send Reply'}
              </Button>
            </div>
          </Card>
        </div>

        {/* ─── Sidebar (controls + user info) ─── */}
        <div className="flex flex-col gap-4">

          {/* Ticket controls */}
          <Card className="p-5">
            <p className="label-mono mb-4">Ticket controls</p>
            <div className="flex flex-col gap-3">
              <Select
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'open',        label: 'Open'         },
                  { value: 'in_progress', label: 'In Progress'  },
                  { value: 'closed',      label: 'Closed'       },
                ]}
              />
              <Select
                label="Priority"
                value={priority}
                onChange={setPriority}
                options={[
                  { value: 'low',    label: 'Low'    },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high',   label: 'High'   },
                ]}
              />
              <Button variant="outline" className="w-full justify-center" onClick={() => toast({ title: 'Ticket updated', variant: 'success' })}>
                Save changes
              </Button>
            </div>
          </Card>

          {/* Customer card */}
          <Card className="p-5">
            <p className="label-mono mb-4">Customer</p>
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={ticket.user.username} size="lg" />
              <div className="min-w-0">
                <Link href={`/admin/users/${ticket.user.username.toLowerCase()}`} className="text-[var(--fg)] font-semibold hover:text-[var(--c)] transition-colors">
                  @{ticket.user.username}
                </Link>
                <p className="text-[var(--fg-mute)] text-[11px] truncate">{ticket.user.email}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--fg-mute)]">Tier</span>
                <span className="text-[var(--warn)] font-bold">{ticket.user.tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--fg-mute)]">Joined</span>
                <span className="text-[var(--fg-dim)]">{ticket.user.joined}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--hairline)] space-y-2">
              <Link href={`/admin/users/${ticket.user.username.toLowerCase()}`} className="btn btn-line btn-sm w-full justify-center"><User size={12} /> Open user page</Link>
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="p-5">
            <p className="label-mono mb-4">Quick actions</p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start">Reset HWID for license</Button>
              <Button variant="outline" size="sm" className="justify-start">Issue refund</Button>
              <Button variant="outline" size="sm" className="justify-start">Extend license expiry</Button>
              <Button variant="outline" size="sm" className="justify-start">Send password reset email</Button>
            </div>
            <p className="text-[10px] text-[var(--fg-mute)] mt-3 leading-relaxed">
              <AlertCircle size={10} className="inline -mt-0.5 mr-1" />
              Every quick action writes to the audit log.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
