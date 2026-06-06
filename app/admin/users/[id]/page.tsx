import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Mail, Wallet, Calendar, Activity, KeyRound, MessageSquare, ShieldCheck, Crown, Store, User as UserIcon, Ban } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { formatPrice, relativeTime } from '@/lib/utils'
import { UserControls } from './UserControls'

export const dynamic = 'force-dynamic'

interface Profile {
  id:                       string
  username:                 string
  email:                    string
  role:                     string
  status:                   string
  balance_cents:            number
  total_spent_cents:        number
  parent_id:                string
  discord_id:               string | null
  discord_username:         string | null
  discord_linked_at:        string | null
  discord_credit_given:     boolean
  reseller_plan_id:         string | null
  reseller_plan_expires_at: string | null
  last_ip:                  string | null
  signup_ip:                string | null
  suspended_until:          string | null
  suspended_reason:         string | null
  created_at:               string
}

interface LicenseRow { id: string; product: string; key_prefix: string; status: string; created_at: string; is_lifetime: boolean }
interface TxRow      { id: string; type: string; amount_cents: number; description: string | null; created_at: string }
interface TicketRow  { id: string; subject: string; status: string; created_at: string; is_priority: boolean }

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = supabaseAdmin()

  const { data: pRaw } = await admin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  const profile = pRaw as Profile | null
  if (!profile) notFound()

  const [licsRes, txRes, ticketsRes] = await Promise.all([
    admin.from('licenses').select('id, product, key_prefix, status, created_at, is_lifetime')
      .eq('user_id', id).order('created_at', { ascending: false }).limit(20),
    admin.from('transactions').select('id, type, amount_cents, description, created_at')
      .eq('user_id', id).order('created_at', { ascending: false }).limit(20),
    admin.from('tickets').select('id, subject, status, created_at, is_priority')
      .eq('user_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  const licenses = (licsRes.data as LicenseRow[] | null) ?? []
  const txns     = (txRes.data   as TxRow[]      | null) ?? []
  const tickets  = (ticketsRes.data as TicketRow[] | null) ?? []

  return (
    <div>
      <Link href="/admin/users" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 mb-4">
        <ChevronLeft size={13} /> All users
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-md flex items-center justify-center text-[20px] font-bold shrink-0"
            style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
            {profile.username[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[22px] font-bold tracking-tight">{profile.username}</h1>
              <RoleBadge role={profile.role} />
              <StatusBadge status={profile.status} />
            </div>
            <p className="text-[12.5px] text-[var(--fg-dim)] font-mono">{profile.email}</p>
            <p className="text-[11px] text-[var(--fg-mute)] mt-0.5">
              Joined {relativeTime(profile.created_at)} · Parent {profile.parent_id}
              {profile.last_ip && <> · Last IP <code className="font-mono">{profile.last_ip}</code></>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: stats + history */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Balance"        value={formatPrice(profile.balance_cents)}     icon={<Wallet size={13} />} />
            <Stat label="Total spent"    value={formatPrice(profile.total_spent_cents ?? 0)} icon={<Activity size={13} />} />
            <Stat label="Licenses"       value={licenses.length.toString()}             icon={<KeyRound size={13} />} />
            <Stat label="Open tickets"   value={tickets.filter(t => t.status === 'open').length.toString()} icon={<MessageSquare size={13} />} />
          </div>

          {/* Discord */}
          <div className="card p-5">
            <p className="label-mono mb-3">Discord</p>
            {profile.discord_id ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'rgba(88,101,242,0.10)' }}>
                  <ShieldCheck size={14} style={{ color: '#5865f2' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[13.5px]">{profile.discord_username ?? profile.discord_id}</p>
                  <p className="text-[11.5px] text-[var(--fg-mute)] font-mono">id: {profile.discord_id} · linked {profile.discord_linked_at ? relativeTime(profile.discord_linked_at) : '?'}</p>
                </div>
                {profile.discord_credit_given && <Pill tone="ok">$1 credit issued</Pill>}
              </div>
            ) : (
              <p className="text-[12.5px] text-[var(--fg-mute)]">Not linked.</p>
            )}
          </div>

          {/* Licenses */}
          <div className="card">
            <div className="px-5 py-3 border-b border-[var(--hairline)] flex items-center justify-between">
              <h2 className="font-semibold text-[13px]">Licenses ({licenses.length})</h2>
            </div>
            {licenses.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12px] text-[var(--fg-mute)]">No licenses.</p>
            ) : (
              <table className="table">
                <thead><tr><th>Key</th><th>Product</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>
                  {licenses.map(l => (
                    <tr key={l.id}>
                      <td><code className="font-mono text-[12px] text-[var(--brand)]">{l.key_prefix}-•••</code></td>
                      <td className="text-[12.5px]">{l.product}</td>
                      <td className="flex items-center gap-1.5">
                        <Pill tone={l.status === 'active' ? 'ok' : l.status === 'banned' ? 'bad' : 'pend'}>{l.status}</Pill>
                        {l.is_lifetime && <Pill tone="brand">lifetime</Pill>}
                      </td>
                      <td className="text-[11.5px] text-[var(--fg-dim)]">{relativeTime(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Tickets */}
          <div className="card">
            <div className="px-5 py-3 border-b border-[var(--hairline)] flex items-center justify-between">
              <h2 className="font-semibold text-[13px]">Tickets ({tickets.length})</h2>
            </div>
            {tickets.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12px] text-[var(--fg-mute)]">No tickets.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--hairline)' }}>
                {tickets.map(t => (
                  <Link key={t.id} href={`/admin/tickets/${t.id}`} className="block px-5 py-3 hover:bg-[var(--surface-2)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium truncate flex items-center gap-1.5">
                          {t.is_priority && <Pill tone="brand">priority</Pill>}
                          {t.subject}
                        </p>
                        <p className="text-[11px] text-[var(--fg-mute)]">{relativeTime(t.created_at)}</p>
                      </div>
                      <Pill tone={t.status === 'open' ? 'warn' : t.status === 'closed' ? 'pend' : 'ok'}>{t.status}</Pill>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Transactions */}
          <div className="card">
            <div className="px-5 py-3 border-b border-[var(--hairline)] flex items-center justify-between">
              <h2 className="font-semibold text-[13px]">Recent transactions</h2>
            </div>
            {txns.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12px] text-[var(--fg-mute)]">No transactions.</p>
            ) : (
              <table className="table">
                <thead><tr><th>Type</th><th>Amount</th><th>Description</th><th>When</th></tr></thead>
                <tbody>
                  {txns.map(t => (
                    <tr key={t.id}>
                      <td className="text-[11.5px] font-mono uppercase tracking-wider text-[var(--fg-dim)]">{t.type.replace(/_/g, ' ')}</td>
                      <td className={`tabular-nums text-[12.5px] ${t.amount_cents >= 0 ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                        {t.amount_cents >= 0 ? '+' : ''}{formatPrice(t.amount_cents)}
                      </td>
                      <td className="text-[12px] text-[var(--fg-dim)] truncate max-w-[260px]">{t.description ?? '—'}</td>
                      <td className="text-[11.5px] text-[var(--fg-mute)]">{relativeTime(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: admin controls */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <UserControls
            userId={profile.id}
            username={profile.username}
            role={profile.role}
            status={profile.status}
            balanceCents={profile.balance_cents}
          />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>{icon}</span>
        <p className="text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-[16px] font-bold tabular-nums">{value}</p>
    </div>
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
      style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
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
