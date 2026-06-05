'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, ChevronRight, Ticket, AlertCircle, Clock, CheckCircle2, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toast'

const tickets = [
  { id: 'TKT-081', user: 'DarkByte',  subject: 'License not activating after reinstall',   category: 'Technical', priority: 'high',   status: 'open',    replies: 2, updated: '8m ago'  },
  { id: 'TKT-080', user: 'NxGhost',   subject: 'Charged twice for same subscription',       category: 'Billing',   priority: 'urgent', status: 'open',    replies: 0, updated: '22m ago' },
  { id: 'TKT-079', user: 'ShadowFx',  subject: 'Can I upgrade from monthly to lifetime?',   category: 'Billing',   priority: 'normal', status: 'pending', replies: 3, updated: '1h ago'  },
  { id: 'TKT-078', user: 'ZeroCode',  subject: 'HWID reset not working on my account',      category: 'Account',   priority: 'high',   status: 'open',    replies: 1, updated: '3h ago'  },
  { id: 'TKT-077', user: 'Vortex99',  subject: 'Referral bonus never credited',             category: 'Billing',   priority: 'normal', status: 'pending', replies: 4, updated: '5h ago'  },
  { id: 'TKT-076', user: 'DarkByte',  subject: 'Tool crashes on Windows 11 24H2',           category: 'Technical', priority: 'high',   status: 'open',    replies: 6, updated: '8h ago'  },
  { id: 'TKT-075', user: 'ProPlayer', subject: 'Request for invoice for tax purposes',      category: 'Billing',   priority: 'low',    status: 'resolved', replies: 2, updated: '1d ago'  },
  { id: 'TKT-074', user: 'ghost_exe', subject: 'Account banned but I did nothing wrong',    category: 'Account',   priority: 'normal', status: 'closed',  replies: 5, updated: '2d ago'  },
]

const priorityTone: Record<string, 'bad' | 'warn' | 'info' | 'mute'> = {
  urgent: 'bad', high: 'warn', normal: 'info', low: 'mute',
}
const statusTone: Record<string, 'ok' | 'warn' | 'info' | 'mute' | 'bad'> = {
  open: 'bad', pending: 'warn', resolved: 'ok', closed: 'mute',
}
const statusIcon: Record<string, React.ReactNode> = {
  open:     <AlertCircle size={12} />,
  pending:  <Clock size={12} />,
  resolved: <CheckCircle2 size={12} />,
  closed:   <CheckCircle2 size={12} />,
}

const openCount    = tickets.filter(t => t.status === 'open').length
const pendingCount = tickets.filter(t => t.status === 'pending').length
const urgentCount  = tickets.filter(t => t.priority === 'urgent').length

export default function TicketsPage() {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatus]     = useState('all')
  const [priorityFilter, setPriority] = useState('all')
  const [page, setPage]               = useState(1)
  const [showCreate, setShowCreate]   = useState(false)
  const [category, setCategory]       = useState('Technical')
  const [priority, setPriorityNew]    = useState('normal')
  const { toast } = useToast()

  const filtered = tickets.filter(t =>
    (t.subject.toLowerCase().includes(search.toLowerCase()) ||
     t.user.toLowerCase().includes(search.toLowerCase()) ||
     t.id.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter   === 'all' || t.status   === statusFilter) &&
    (priorityFilter === 'all' || t.priority === priorityFilter)
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Tickets</h1>
          <p className="text-[#9ca3af] text-sm mt-1 flex items-center gap-3">
            <span className="text-[#ff5b75] font-semibold">{openCount} open</span>
            <span className="text-[#ffae50] font-semibold">{pendingCount} pending</span>
            {urgentCount > 0 && <span className="text-[#ff5b75] font-bold animate-pulse">{urgentCount} urgent</span>}
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          New Ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input
            placeholder="Search by ID, user, or subject..."
            icon={<Search size={14} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={statusFilter}
            onChange={setStatus}
            options={[
              { value: 'all',      label: 'All statuses' },
              { value: 'open',     label: 'Open'         },
              { value: 'pending',  label: 'Pending'      },
              { value: 'resolved', label: 'Resolved'     },
              { value: 'closed',   label: 'Closed'       },
            ]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={priorityFilter}
            onChange={setPriority}
            options={[
              { value: 'all',    label: 'All priorities' },
              { value: 'urgent', label: 'Urgent'         },
              { value: 'high',   label: 'High'           },
              { value: 'normal', label: 'Normal'         },
              { value: 'low',    label: 'Low'            },
            ]}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-onyx">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>User</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Replies</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-[#4b5563]">
                    <Ticket size={28} className="mx-auto mb-2 opacity-30" />
                    No tickets match your filters
                  </td>
                </tr>
              ) : filtered.map(t => (
                <tr key={t.id}>
                  <td className="font-mono text-[#ff3a00] text-xs font-bold">{t.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar name={t.user} size="sm" />
                      <span className="text-white font-semibold text-sm">@{t.user}</span>
                    </div>
                  </td>
                  <td className="max-w-[240px]">
                    <p className="text-white text-sm truncate">{t.subject}</p>
                  </td>
                  <td><span className="status status-mute">{t.category}</span></td>
                  <td>
                    <StatusBadge tone={priorityTone[t.priority]}>
                      {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                    </StatusBadge>
                  </td>
                  <td>
                    <StatusBadge tone={statusTone[t.status]} dot>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </StatusBadge>
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5 text-[#9ca3af] text-sm">
                      <MessageSquare size={12} />
                      {t.replies}
                    </span>
                  </td>
                  <td className="text-[#9ca3af] text-sm">{t.updated}</td>
                  <td>
                    <Link href={`/admin/tickets/${t.id}`} className="btn btn-ghost btn-sm text-[#ff3a00]">
                      Open <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-center mt-6">
        <Pagination page={page} totalPages={4} onPageChange={setPage} />
      </div>

      {/* Create ticket modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Support Ticket"
        description="Open a ticket on behalf of a user or for internal tracking."
        maxWidth={560}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowCreate(false)
                toast({ title: 'Ticket created', description: 'TKT-082 opened.', variant: 'success' })
              }}
            >
              Create Ticket
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="User (username or email)" placeholder="DarkByte" />
          <Input label="Subject" placeholder="Brief description of the issue" />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { value: 'Technical', label: 'Technical' },
                { value: 'Billing',   label: 'Billing'   },
                { value: 'Account',   label: 'Account'   },
                { value: 'General',   label: 'General'   },
              ]}
            />
            <Select
              label="Priority"
              value={priority}
              onChange={setPriorityNew}
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high',   label: 'High'   },
                { value: 'normal', label: 'Normal' },
                { value: 'low',    label: 'Low'    },
              ]}
            />
          </div>
          <Textarea label="Initial message" rows={4} placeholder="Describe the issue in detail..." />
        </div>
      </Modal>
    </div>
  )
}
