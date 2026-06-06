import Link from 'next/link'
import { Users } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { formatPrice, relativeTime } from '@/lib/utils'

interface UserRow {
  id:             string
  username:       string
  email:          string
  balance_cents:  number
  role:           string
  created_at:     string
}

export default async function AdminUsersPage() {
  const { data } = await supabaseAdmin()
    .from('profiles')
    .select('id, username, email, balance_cents, role, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const users = (data ?? []) as UserRow[]

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight">Users</h1>
        <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">{users.length} accounts. Full edit + reseller approval coming in Phase 3.</p>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Balance</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <Link href={`/admin/users/${u.id}`} className="text-[var(--fg)] font-semibold hover:text-[var(--brand)] transition-colors">
                    {u.username}
                  </Link>
                </td>
                <td className="text-[12.5px]">{u.email}</td>
                <td><Pill tone="brand">{u.role}</Pill></td>
                <td className="font-mono text-[var(--ok)] font-semibold">{formatPrice(u.balance_cents)}</td>
                <td className="text-[12px]">{relativeTime(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="card p-10 text-center mt-4">
          <div className="empty-mark"><Users size={20} /></div>
          <p className="text-[14px] font-medium">No users yet</p>
          <p className="text-[12.5px] text-[var(--fg-dim)]">They&apos;ll show up here once anyone signs up.</p>
        </div>
      )}
    </div>
  )
}
