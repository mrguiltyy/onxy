'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'

const users = [
  { id: 'darkbyte',  username: 'DarkByte',  email: 'dark@example.com', balance: '$42.50',  tier: 'Gold',    licenses: 2, joined: 'May 1, 2026',  status: 'active',  flags: 0 },
  { id: 'nxghost',   username: 'NxGhost',   email: 'nx@example.com',   balance: '$5.00',   tier: 'Onyx',    licenses: 1, joined: 'May 8, 2026',  status: 'active',  flags: 0 },
  { id: 'shadowfx',  username: 'ShadowFx',  email: 'sfx@example.com',  balance: '$120.00', tier: 'Diamond', licenses: 3, joined: 'Apr 1, 2026',  status: 'active',  flags: 0 },
  { id: 'ghost_exe', username: 'ghost_exe', email: 'g@example.com',    balance: '$0.00',   tier: 'Onyx',    licenses: 0, joined: 'May 29, 2026', status: 'flagged', flags: 2 },
  { id: 'zerofrost', username: 'ZeroFrost', email: 'z@example.com',    balance: '$9.99',   tier: 'Onyx',    licenses: 1, joined: 'May 20, 2026', status: 'banned',  flags: 5 },
]

const tierColors: Record<string, string> = { Diamond: '#ff3a00', Gold: '#ffae50', Silver: '#9ca3af', Onyx: '#6b7280' }

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = users.filter(u =>
    (u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'all' || u.status === statusFilter)
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Users</h1>
          <p className="text-[#9ca3af] text-sm mt-1">{users.length} total registered users</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />}>Create User</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input placeholder="Search by username or email..." icon={<Search size={14} />} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all',     label: 'All status' },
              { value: 'active',  label: 'Active'     },
              { value: 'flagged', label: 'Flagged'    },
              { value: 'banned',  label: 'Banned'     },
            ]}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-onyx">
            <thead>
              <tr>
                <th>User</th>
                <th>Balance</th>
                <th>Tier</th>
                <th>Licenses</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Flags</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.username} size="sm" />
                      <div>
                        <p className="text-white font-semibold text-sm">{u.username}</p>
                        <p className="text-[#9ca3af] text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-[#ff3a00] font-bold">{u.balance}</td>
                  <td><span className="font-bold text-sm" style={{ color: tierColors[u.tier] }}>{u.tier}</span></td>
                  <td className="text-white font-semibold">{u.licenses}</td>
                  <td>{u.joined}</td>
                  <td><StatusBadge tone={u.status === 'active' ? 'ok' : u.status === 'flagged' ? 'warn' : 'bad'} dot>{u.status}</StatusBadge></td>
                  <td>{u.flags > 0 ? <span className="text-[#ffae50] font-bold">{u.flags}</span> : <span className="text-[#4b5563]">—</span>}</td>
                  <td>
                    <Link href={`/admin/users/${u.id}`} className="btn btn-ghost btn-sm text-[#ff3a00]">
                      Manage <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-center mt-6">
        <Pagination page={page} totalPages={5} onPageChange={setPage} />
      </div>
    </div>
  )
}
