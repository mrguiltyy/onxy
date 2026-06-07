import Link from 'next/link'
import { KeyRound, Plus, Wallet, Activity, ArrowRight, ShieldCheck, BookOpen, Boxes, MessageSquare, Bell, LifeBuoy } from 'lucide-react'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { formatPrice, relativeTime } from '@/lib/utils'
import { Pill } from '@/components/ui/Pill'
import { StatusPanel } from './widgets/StatusPanel'
import { ActivityHeatmap } from './widgets/ActivityHeatmap'
import { MonthlyChart } from './widgets/MonthlyChart'

export const dynamic = 'force-dynamic'

interface Profile {
  username:           string
  email:              string
  balance_cents:      number
  parent_id:          string
  role:               string
  tier:               string
  two_factor_enabled: boolean
  avatar_url:         string | null
  created_at:         string
}
interface License { id: string; product: string; key_prefix: string; status: string; expires_at: string | null; created_at: string }
interface Activity { id: string; event_type: string; target_label: string | null; created_at: string }
interface Announcement { message: string; variant: string; created_at: string }

export default async function DashboardPage() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('username, email, balance_cents, parent_id, role, tier, two_factor_enabled, avatar_url, created_at')
    .eq('id', user!.id)
    .single()
  const profile = (profileRaw ?? null) as Profile | null

  const [licsRes, actsRes, annsRes] = await Promise.all([
    supabase.from('licenses')
      .select('id, product, key_prefix, status, expires_at, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('activity')
      .select('id, event_type, target_label, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('announcements')
      .select('message, variant, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const lics = (licsRes.data ?? []) as License[]
  const acts = (actsRes.data ?? []) as Activity[]
  const anns = (annsRes.data ?? []) as Announcement[]

  // Aggregates
  const totalKeys   = lics.length
  const activeKeys  = lics.filter(l => l.status === 'active').length
  const bannedKeys  = lics.filter(l => l.status === 'banned').length
  const expiredKeys = lics.filter(l => l.status === 'expired').length

  // Activity heatmap: count per day for last 365 days
  const admin = supabaseAdmin()
  const yearAgo = new Date(Date.now() - 365 * 86_400_000).toISOString()
  const { data: yearActsRaw } = await admin
    .from('activity').select('created_at')
    .eq('user_id', user!.id)
    .gte('created_at', yearAgo)
  const yearActs = (yearActsRaw as { created_at: string }[] | null) ?? []
  const heatmap = buildHeatmap(yearActs.map(a => a.created_at))

  // Monthly chart: license generations per month last 7 months
  const monthly = buildMonthly(lics.map(l => l.created_at))

  // 2FA recommendation
  const show2FA = !profile?.two_factor_enabled

  return (
    <div className="animate-in space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">Welcome back, {profile?.username}</h1>
          <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">Here&apos;s an overview of your panel.</p>
        </div>
        <Link href="/dashboard/generate" className="btn btn-primary btn-sm">
          <Plus size={13} /> Generate key
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── Row 1 ─ Overview + Announcements + Quick Links + Discord ── */}

        {/* Overview */}
        <div className="lg:col-span-3 card p-5">
          <p className="label-mono mb-4">Overview</p>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Total Licenses" value={totalKeys} />
            <Stat label="Active" value={activeKeys} tone="ok" />
            <Stat label="Banned" value={bannedKeys} tone="bad" />
            <Stat label="Expired" value={expiredKeys} tone="warn" />
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--hairline)' }}>
            <p className="text-[10px] text-[var(--fg-mute)] uppercase tracking-wider">Wallet balance</p>
            <p className="text-[22px] font-bold text-[var(--ok)] tabular-nums leading-tight mt-1" style={{ letterSpacing: '-0.02em' }}>
              {formatPrice(profile?.balance_cents ?? 0)}
            </p>
            <Link href="/dashboard/balance" className="text-[11.5px] text-[var(--brand)] hover:underline inline-flex items-center gap-1 mt-1">
              Top up <ArrowRight size={10} />
            </Link>
          </div>
        </div>

        {/* Announcements */}
        <div className="lg:col-span-4 card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="label-mono">Announcements</p>
            <Bell size={11} className="text-[var(--fg-mute)]" />
          </div>
          {anns.length === 0 ? (
            <p className="text-[12.5px] text-[var(--fg-mute)]">No announcements right now.</p>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {anns.map((a, i) => (
                <div key={i} className="pb-3 border-b last:border-b-0" style={{ borderColor: 'var(--hairline)' }}>
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-[13px] font-semibold leading-snug">{a.message.split('\n')[0]?.slice(0, 80) ?? '—'}</p>
                    <span className="text-[10px] text-[var(--fg-mute)] tabular-nums font-mono shrink-0">{new Date(a.created_at).toISOString().slice(0,10)}</span>
                  </div>
                  {a.message.split('\n')[1] && (
                    <p className="text-[11.5px] text-[var(--fg-dim)] line-clamp-2 leading-relaxed">{a.message.split('\n').slice(1).join(' ')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-3 card p-5">
          <p className="label-mono mb-4">Quick links</p>
          <div className="grid grid-cols-2 gap-2">
            <QuickLink href="/dashboard/generate" icon={<Plus size={12} />}        label="Generate" />
            <QuickLink href="/dashboard/licenses" icon={<KeyRound size={12} />}    label="Licenses" />
            <QuickLink href="/dashboard/balance"  icon={<Wallet size={12} />}      label="Top-up" />
            <QuickLink href="/dashboard/applications" icon={<Boxes size={12} />}   label="Apps" />
            <QuickLink href="/dashboard/troubleshoot" icon={<LifeBuoy size={12} />}label="Help" />
            <QuickLink href="/dashboard/tickets"  icon={<MessageSquare size={12} />}label="Tickets" />
          </div>
        </div>

        {/* Discord join */}
        <div className="lg:col-span-2 card overflow-hidden p-0 flex flex-col" style={{ minHeight: 280 }}>
          <div
            className="h-20 relative"
            style={{
              background: 'linear-gradient(135deg, #5865f2 0%, #7289da 50%, #4752c4 100%)',
              borderBottom: '1px solid var(--hairline)',
            }}
          >
            <svg viewBox="0 0 71 55" className="absolute right-3 top-3 opacity-25" width="42" height="42" fill="#fff">
              <path d="M60.1 4.9C55.6 2.8 50.7 1.3 45.7 0.4c-.7 1.1-1.4 2.6-1.9 3.7-5.5-.8-10.9-.8-16.3 0-.5-1.1-1.2-2.6-1.9-3.7C20.3 1.3 15.4 2.8 10.9 4.9 1.6 18.7-1 32.1.3 45.4c6.1 4.5 12 7.2 17.8 9 1.4-1.9 2.6-3.9 3.6-5.9-2-.7-3.8-1.6-5.6-2.7.5-.3.9-.6 1.3-.9 11.6 5.3 24.2 5.3 35.7 0 .4.3.8.6 1.3.9-1.8 1-3.6 2-5.6 2.7 1.1 2 2.3 3.9 3.6 5.9 5.8-1.8 11.7-4.5 17.8-9 1.5-15.3-2.5-28.6-10.5-40.5zM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.2 6.4 7.2c0 4-2.8 7.2-6.4 7.2zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.2 6.4 7.2c0 4-2.8 7.2-6.4 7.2z"/>
            </svg>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <p className="font-semibold text-[14px] mb-0.5">Join Discord</p>
            <p className="text-[11px] text-[var(--fg-dim)] leading-snug mb-3 flex-1">
              Get support, updates and connect with other OP users.
            </p>
            <a
              href="https://discord.gg/onxy"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm w-full"
              style={{ background: '#5865f2', color: '#fff', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              Join server
            </a>
          </div>
        </div>

        {/* ── Row 2 ─ Recent activity + System status + Monthly chart ── */}

        {/* Recent activity */}
        <div className="lg:col-span-4 card p-0">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--hairline)' }}>
            <p className="label-mono">Recent activity</p>
            <Link href="/dashboard/licenses" className="text-[11.5px] text-[var(--brand)] hover:underline">View all</Link>
          </div>
          {acts.length === 0 ? (
            <p className="px-5 py-10 text-center text-[12.5px] text-[var(--fg-mute)]">No recent activity</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--hairline)' }}>
              {acts.map(a => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
                    <Activity size={12} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium capitalize">{a.event_type}</p>
                    {a.target_label && <p className="text-[11px] text-[var(--fg-dim)] font-mono truncate">{a.target_label}</p>}
                  </div>
                  <span className="text-[10.5px] text-[var(--fg-mute)] shrink-0">{relativeTime(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System status */}
        <div className="lg:col-span-4 card p-5">
          <StatusPanel />
        </div>

        {/* Monthly stats chart */}
        <div className="lg:col-span-4 card p-5">
          <p className="label-mono mb-3">Monthly key generations</p>
          <MonthlyChart data={monthly} />
        </div>

        {/* ── Row 3 ─ Activity heatmap full width ── */}
        <div className="lg:col-span-12 card p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="label-mono">Activity heatmap · last 12 months</p>
            <div className="flex items-center gap-2 text-[10.5px] text-[var(--fg-mute)]">
              Less
              <span className="flex items-center gap-0.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--surface-2)' }} />
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(59,130,246,0.20)' }} />
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(59,130,246,0.45)' }} />
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(59,130,246,0.70)' }} />
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--brand)' }} />
              </span>
              More
            </div>
          </div>
          <ActivityHeatmap days={heatmap} />
        </div>

        {/* 2FA recommendation */}
        {show2FA && (
          <div className="lg:col-span-12 rounded-md px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
            style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.25)' }}>
            <div className="flex items-center gap-2 text-[12.5px] text-[var(--fg-dim)]">
              <ShieldCheck size={13} className="text-[var(--warn)]" />
              <span><strong className="text-[var(--fg)]">Recommended:</strong> add 2FA for extra security.</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/account" className="text-[12px] text-[var(--brand)] hover:underline">Set up</Link>
              <span className="text-[var(--fg-mute)]">·</span>
              <Link href="/faq" className="text-[12px] text-[var(--brand)] hover:underline">Get authenticator app</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
function buildHeatmap(timestamps: string[]): { date: string; count: number }[] {
  const byDay = new Map<string, number>()
  for (const ts of timestamps) {
    const d = ts.slice(0, 10)
    byDay.set(d, (byDay.get(d) ?? 0) + 1)
  }
  // last 365 days
  const out: { date: string; count: number }[] = []
  for (let i = 364; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    out.push({ date: d, count: byDay.get(d) ?? 0 })
  }
  return out
}

function buildMonthly(timestamps: string[]): { month: string; count: number }[] {
  const byMonth = new Map<string, number>()
  for (const ts of timestamps) {
    const m = ts.slice(0, 7)
    byMonth.set(m, (byMonth.get(m) ?? 0) + 1)
  }
  const out: { month: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const m = d.toISOString().slice(0, 7)
    out.push({ month: m, count: byMonth.get(m) ?? 0 })
  }
  return out
}

function Stat({ label, value, tone = 'brand' }: { label: string; value: number; tone?: 'brand' | 'ok' | 'bad' | 'warn' }) {
  const c = tone === 'ok'  ? 'var(--ok)'
          : tone === 'bad' ? 'var(--bad)'
          : tone === 'warn'? 'var(--warn)'
          : 'var(--fg)'
  return (
    <div>
      <p className="text-[10px] text-[var(--fg-mute)] uppercase tracking-wider">{label}</p>
      <p className="text-[22px] font-bold tabular-nums leading-tight mt-0.5" style={{ color: c, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2.5 rounded-md inline-flex items-center gap-2 text-[12.5px] font-medium border transition-colors hover:border-[var(--hairline-2)]"
      style={{ background: 'var(--surface-2)', borderColor: 'var(--hairline)' }}
    >
      <span style={{ color: 'var(--brand)' }}>{icon}</span>
      {label}
    </Link>
  )
}
