'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, MessageSquare, Clock, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs, TabsList, Tab, TabPanel } from '@/components/ui/Tabs'

const tickets = [
  { id: 'TKT-0042', subject: 'HWID reset request — new PC build', category: 'HWID Reset', status: 'open',        priority: 'medium', updatedAt: '2h ago', messages: 3 },
  { id: 'TKT-0039', subject: 'Onyx Stealth not launching after update', category: 'Technical', status: 'in_progress', priority: 'high', updatedAt: '5h ago', messages: 7 },
  { id: 'TKT-0031', subject: 'Billing question — wallet top-up',   category: 'Billing',   status: 'closed', priority: 'low', updatedAt: '3d ago', messages: 4 },
  { id: 'TKT-0028', subject: 'Can I transfer my license to another account?', category: 'General', status: 'closed', priority: 'low', updatedAt: '1w ago', messages: 2 },
]

const statusTone = (s: string) =>
  s === 'open' ? 'cyan' : s === 'in_progress' ? 'warn' : 'mute'

const statusLabel = (s: string) =>
  s === 'open' ? 'Open' : s === 'in_progress' ? 'In Progress' : 'Closed'

export default function TicketsPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const filtered = filter === 'all' ? tickets : tickets.filter(t => filter === 'open' ? t.status !== 'closed' : t.status === 'closed')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Support Tickets</h1>
          <p className="text-[#9ca3af] text-sm mt-1">Get help from the Onyx team.</p>
        </div>
        <Link href="/dashboard/tickets/new" className="btn btn-primary">
          <Plus size={14} /> New Ticket
        </Link>
      </div>

      <Tabs defaultValue={filter} onChange={(v) => setFilter(v as 'all' | 'open' | 'closed')}>
        <div className="mb-6">
          <TabsList>
            <Tab value="all">All <span className="text-[#6b7280] ml-1">{tickets.length}</span></Tab>
            <Tab value="open">Open <span className="text-[#6b7280] ml-1">{tickets.filter(t => t.status !== 'closed').length}</span></Tab>
            <Tab value="closed">Closed <span className="text-[#6b7280] ml-1">{tickets.filter(t => t.status === 'closed').length}</span></Tab>
          </TabsList>
        </div>

        <TabPanel value={filter}>
          <div className="flex flex-col gap-3">
            {filtered.map(t => (
              <Link key={t.id} href={`/dashboard/tickets/${t.id}`} className="block">
                <Card hover="cyan" className="p-5 flex items-center gap-4 group cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(255,58,0,0.08)] border border-[rgba(255,58,0,0.15)] flex items-center justify-center shrink-0">
                    <MessageSquare size={14} className="text-[#ff3a00]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] text-[#6b7280]">{t.id}</span>
                      <span className="status status-mute text-[9px]">{t.category}</span>
                    </div>
                    <p className="text-white font-semibold text-sm truncate">{t.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={9} className="text-[#4b5563]" />
                      <span className="text-[10px] text-[#9ca3af]">Updated {t.updatedAt}</span>
                      <span className="text-[#4b5563]">·</span>
                      <span className="text-[10px] text-[#9ca3af]">{t.messages} messages</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge tone={statusTone(t.status) as 'cyan' | 'warn' | 'mute'} dot>{statusLabel(t.status)}</StatusBadge>
                    <ChevronRight size={14} className="text-[#4b5563] group-hover:text-[#ff3a00] transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}

            {filtered.length === 0 && (
              <EmptyState
                icon={<MessageSquare size={20} />}
                title="No tickets found"
                description="Open a new ticket if you need help with anything."
                action={<Button variant="primary" icon={<Plus size={14} />}>New Ticket</Button>}
              />
            )}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  )
}
