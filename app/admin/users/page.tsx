import Link from 'next/link'
import { Search, Crown, Store, User as UserIcon, Ban } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { formatPrice, relativeTime } from '@/lib/utils'

export const metadata = { title: 'Users · Admin' }
export const dynamic = 'force-dynamic'

interface UserRow {
  id:                string
  username:          string
  email:             string
  role:              string
  status:            string
  balance_cents:     number
  total_spent_cents: number
  discord_username:  string | null
  reseller_plan_expires_at: string | null
  last_ip:           string | null
  created_at:        string
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; status?: string }> }) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const filterRole = params.role ?? 'all'
  const filterStatus = params.status ?? 'all'

  const admin = supabaseAdmin()

  let query = admin
    .from('profiles')
    .select('id, username, email, role, status, balance_cents, total_spent_cents, discord_username, reseller_plan_expires_at, last_ip, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (filterRole !== 'all')   query = query.eq('role', filterRole)
  if (filterStatus !== 'all') query = query.eq('status', filterStatus)
  if (q) query = query.or(`username.ilike.%${q}%,email.ilike.%${q}%`)

  const { data: usersRaw } = await query
  const users = (usersRaw as UserRow[] | null) ?? []

  const [totalRes, userRes, resellerRes, adminRes, suspendedRes] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'reseller'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['super_admin','support']),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-bold tracking-tight">Users</h1>
        <p className="text-[13px] text-[var(--fg-dim)] mt-1">Manage all accounts. Click a row to view and edit.</p>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterChip href="/admin/users"                 label={`All · ${totalRes.count ?? 0}`}              active={filterRole === 'all' && filterStatus === 'all'} />
        <FilterChip href="/admin/users?role=user"       label={`Users · ${userRes.count ?? 0}`}             active={filterRole === 'user'}        icon={<UserIcon size={11} />} />
        <FilterChip href="/admin/users?role=reseller"   label={`Resellers · ${resellerRes.count ?? 0}`}     active={filterRole === 'reseller'}    icon={<Store size={11} />}    accent="brand" />
        <FilterChip href="/admin/users?role=super_admin"label={`Admins · ${adminRes.count ?? 0}`}           active={filterRole === 'super_admin'} icon={<Crown size={11} />}    accent="brand" />
        <FilterChip href="/admin/users?status=suspended"label={`Suspended · ${suspendedRes.count ?? 0}`}    active={filterStatus === 'suspended'}  icon={<Ban size={11} />}     accent="bad" />
      </div>

      <form className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-[400px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-mute)]" />
          <input type="text" name="q" defaultValue={q} placeholder="Search username or email…" className="form-input pl-9" />
        </div>
        {filterRole !== 'all' && <input type="hidden" name="role" value={filterRole} />}
        {filterStatus !== 'all' && <input type="hidden" name="status" value={filterStatus} />}
        <button type="submit" className="btn btn-secondary btn-sm">Search</button>
      </form>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Balance</th>
              <th>Total spent</th>
              <th>Discord</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[12.5px] text-[var(--fg-mute)]">
                  No users match.
                </td>
              </tr>
            ) : users.map(u => (
              <tr key={u.id} className="cursor-pointer">
                <td>
                  <Link href={`/admin/users/${u.id}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
                        {u.username[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--fg)] truncate">{u.username}</p>
                        <p className="text-[11px] text-[var(--fg-mute)] truncate font-mono">{u.email}</p>
                      </div>
                    </div>
                  </Link>
                </td>
                <td><RoleBadge role={u.role} /></td>
                <td><StatusBadge status={u.status} /></td>
                <td className="tabular-nums text-[12.5px]">{formatPrice(u.balance_cents)}</td>
                <td className="tabular-nums text-[12.5px] text-[var(--fg-dim)]">{formatPrice(u.total_spent_cents ?? 0)}</td>
                <td className="text-[11.5px] text-[var(--fg-dim)] font-mono">{u.discord_username ?? '—'}</td>
                <td className="text-[11.5px] text-[var(--fg-dim)]">{relativeTime(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilterChip({ href, label, active, icon, accent }: { href: string; label: string; active: boolean; icon?: React.ReactNode; accent?: 'brand' | 'bad' }) {
  const baseColor = accent === 'brand' ? 'var(--brand)' : accent === 'bad' ? 'var(--bad)' : 'var(--fg-dim)'
  const activeBg = accent === 'brand' ? 'var(--brand-faint)' : accent === 'bad' ? 'rgba(239,68,68,0.08)' : 'var(--surface-2)'
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium border transition-colors"
      style={{
        background:  active ? activeBg : 'transparent',
        color:       active ? baseColor : 'var(--fg-dim)',
        borderColor: active ? (accent === 'brand' ? 'rgba(59,130,246,0.30)' : accent === 'bad' ? 'rgba(239,68,68,0.25)' : 'var(--hairline-2)') : 'var(--hairline)',
      }}
    >
      {icon} {label}
    </Link>
  )
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'super_admin') return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
      <Crown size={9} /> Admin
    </span>
  )
  if (role === 'support')  return <Pill tone="brand">Support</Pill>
  if (role === 'reseller') return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ background: 'var(--brand-faint)', color: 'var(--brand)', border: '1px solid rgba(59,130,246,0.25)' }}>
      <Store size={9} /> Reseller
    </span>
  )
  return <Pill tone="pend">User</Pill>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'suspended') return <Pill tone="warn">suspended</Pill>
  if (status === 'banned')    return <Pill tone="bad">banned</Pill>
  return <Pill tone="ok">active</Pill>
}
