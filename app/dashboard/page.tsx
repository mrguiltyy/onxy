import Link from 'next/link'
import { KeyRound, Plus, Wallet, Activity, BookOpen, Boxes, MessageSquare, Sparkles, Zap, ChevronRight } from 'lucide-react'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { formatPrice, relativeTime } from '@/lib/utils'
import { Pill } from '@/components/ui/Pill'
import { ActivityHeatmap } from './widgets/ActivityHeatmap'
import { MonthlyChart } from './widgets/MonthlyChart'
import { WelcomeBanner } from './WelcomeBanner'

export const dynamic = 'force-dynamic'

interface Profile {
  username:           string
  email:              string
  balance_cents:      number
  parent_id:          string
  role:               string
  tier?:              string
  two_factor_enabled?:boolean
  avatar_url?:        string | null
  discord_id?:        string | null
  onboarded_at?:      string | null
  created_at:         string
}
interface License { id: string; product: string; key_prefix: string; status: string; expires_at: string | null; created_at: string }
interface ActivityRow { id: string; event_type: string; target_label: string | null; created_at: string }
interface Announcement { message: string; variant: string; created_at: string }
interface Tx { id: string; type: string; amount_cents: number; description: string | null; created_at: string }

export default async function DashboardPage() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: baseRaw } = await supabase
    .from('profiles')
    .select('username, email, balance_cents, parent_id, role, created_at')
    .eq('id', user!.id)
    .maybeSingle()

  let extras: { tier?: string; two_factor_enabled?: boolean; avatar_url?: string | null; discord_id?: string | null; onboarded_at?: string | null } = {}
  try {
    const { data: extRaw, error: extErr } = await supabase
      .from('profiles')
      .select('tier, two_factor_enabled, avatar_url, discord_id, onboarded_at')
      .eq('id', user!.id)
      .maybeSingle()
    if (!extErr && extRaw) extras = extRaw as typeof extras
  } catch {}
  const profile = (baseRaw ? { ...baseRaw, ...extras } : null) as Profile | null
  const discordLinked  = !!extras.discord_id
  const onboardingDone = !!extras.onboarded_at

  const [licsRes, actsRes, annsRes, txRes] = await Promise.all([
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
      .limit(3),
    supabase.from('transactions')
      .select('id, type, amount_cents, description, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const lics = (licsRes.data ?? []) as License[]
  const acts = (actsRes.data ?? []) as ActivityRow[]
  const anns = (annsRes.data ?? []) as Announcement[]
  const txns = (txRes.data ?? []) as Tx[]

  // Aggregates
  const totalKeys   = lics.length
  const activeKeys  = lics.filter(l => l.status === 'active').length
  const expiringSoon = lics.filter(l => l.expires_at && new Date(l.expires_at).getTime() - Date.now() < 7 * 86_400_000 && new Date(l.expires_at).getTime() > Date.now()).length

  // Heatmap
  const admin = supabaseAdmin()
  const yearAgo = new Date(Date.now() - 365 * 86_400_000).toISOString()
  const { data: yearActsRaw } = await admin
    .from('activity').select('created_at')
    .eq('user_id', user!.id)
    .gte('created_at', yearAgo)
  const yearActs = (yearActsRaw as { created_at: string }[] | null) ?? []
  const heatmap = buildHeatmap(yearActs.map(a => a.created_at))
  const yearTotal = yearActs.length

  // Monthly
  const monthly = buildMonthly(lics.map(l => l.created_at))

  // Member since
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'recently'

  return (
    <div className="animate-in">

      <WelcomeBanner
        username={profile?.username ?? 'there'}
        discordLinked={discordLinked}
        hasLicense={totalKeys > 0}
        onboardingDone={onboardingDone}
      />

      {/* ── Hero — distinctive, not template-y ───────────────────── */}
      <section
        className="relative mb-6 rounded-xl overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--hairline)',
        }}
      >
        {/* Subtle key-grid pattern — distinctive vs generic blob */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--fg) 1px, transparent 1px),' +
              'linear-gradient(to bottom, var(--fg) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'linear-gradient(to bottom right, black 30%, transparent 80%)',
          }}
        />
        <div
          className="absolute right-0 top-0 w-[200px] h-full pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(240,164,183,0.06) 60%, rgba(240,164,183,0.10) 100%)',
          }}
        />

        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center p-6 md:p-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand)' }} />
              <p className="label-mono">{new Date().toLocaleDateString('en-US', { weekday: 'long' })} · {profile?.role === 'super_admin' ? 'admin' : profile?.role === 'reseller' ? 'reseller' : 'customer'}</p>
            </div>
            <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight text-[var(--fg)]" style={{ letterSpacing: '-0.025em' }}>
              {profile?.username}
            </h1>
            <p className="text-[12.5px] text-[var(--fg-mute)] mt-1 font-mono">
              {totalKeys} {totalKeys === 1 ? 'key' : 'keys'} · {activeKeys} active · joined {memberSince.toLowerCase()}
            </p>

            <div className="flex items-center gap-2 mt-5 flex-wrap">
              <Link href="/dashboard/generate" className="btn btn-primary btn-sm">
                <Plus size={12} /> New key
              </Link>
              <Link href="/dashboard/balance" className="btn btn-secondary btn-sm">
                <Wallet size={12} /> Top up
              </Link>
            </div>
          </div>

          {/* Compact status panel — no rainbow tiles */}
          <div
            className="rounded-lg p-3 md:p-4 min-w-[260px]"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}
          >
            <StatusRow label="Wallet"       value={formatPrice(profile?.balance_cents ?? 0)} />
            <StatusRow label="Active keys"  value={activeKeys.toString()} accent={activeKeys > 0 ? 'ok' : undefined} />
            <StatusRow label="Expiring 7d"  value={expiringSoon.toString()} accent={expiringSoon > 0 ? 'warn' : undefined} last />
          </div>
        </div>
      </section>

      {/* ── Main 2-col grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">

        {/* ─── LEFT column ─── */}
        <div className="space-y-5">

          {/* Activity heatmap */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <div>
                <p className="label-mono">Your year so far</p>
                <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">
                  <strong className="text-[var(--fg)] tabular-nums">{yearTotal}</strong> events across the last 12 months
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10.5px] text-[var(--fg-mute)]">
                Less
                <span className="flex items-center gap-0.5 mx-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--surface-2)' }} />
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(59,130,246,0.20)' }} />
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(59,130,246,0.45)' }} />
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(59,130,246,0.70)' }} />
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--brand)' }} />
                </span>
                More
              </div>
            </div>
            <div className="mt-4">
              <ActivityHeatmap days={heatmap} />
            </div>
          </div>

          {/* Recent activity stream */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--hairline)' }}>
              <p className="font-semibold text-[13.5px] flex items-center gap-2">
                <Activity size={12} className="text-[var(--brand)]" /> Recent activity
              </p>
              <Link href="/dashboard/licenses" className="text-[11.5px] text-[var(--brand)] hover:underline inline-flex items-center gap-1">
                Licenses <ChevronRight size={11} />
              </Link>
            </div>
            {acts.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <Sparkles size={24} className="mx-auto mb-2 text-[var(--fg-faint)]" />
                <p className="text-[13px] text-[var(--fg-mute)] mb-3">No moves yet</p>
                <Link href="/dashboard/generate" className="btn btn-primary btn-sm inline-flex">
                  <Plus size={11} /> Generate your first key
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--hairline)' }}>
                {acts.map(a => {
                  const color =
                    a.event_type.includes('fail') || a.event_type.includes('banned') ? 'var(--bad)' :
                    a.event_type.includes('generated') || a.event_type.includes('redeemed') ? 'var(--ok)' :
                    'var(--brand)'
                  return (
                    <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors">
                      <span className="w-0.5 h-7 rounded-sm shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium capitalize">{a.event_type.replace(/_/g, ' ')}</p>
                        {a.target_label && <p className="text-[11px] text-[var(--fg-dim)] font-mono truncate">{a.target_label}</p>}
                      </div>
                      <span className="text-[10.5px] text-[var(--fg-mute)] shrink-0">{relativeTime(a.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Monthly chart */}
          <div className="card p-5">
            <p className="label-mono mb-1">Key generations</p>
            <p className="text-[12px] text-[var(--fg-dim)] mb-4">Last 7 months</p>
            <MonthlyChart data={monthly} />
          </div>
        </div>

        {/* ─── RIGHT column ─── */}
        <div className="space-y-5">

          {/* Announcements */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--hairline)' }}>
              <p className="font-semibold text-[13.5px] flex items-center gap-2">
                <Sparkles size={12} className="text-[var(--brand)]" /> What&apos;s new
              </p>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-mute)]">{anns.length} update{anns.length === 1 ? '' : 's'}</span>
            </div>
            {anns.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12.5px] text-[var(--fg-mute)]">Nothing new right now.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--hairline)' }}>
                {anns.map((a, i) => (
                  <div key={i} className="px-5 py-3">
                    <p className="text-[12.5px] font-medium leading-snug">{a.message.split('\n')[0]?.slice(0, 90) ?? '—'}</p>
                    <p className="text-[10.5px] text-[var(--fg-mute)] font-mono mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <p className="label-mono mb-3">Jump to</p>
            <div className="space-y-1.5">
              <JumpRow href="/dashboard/licenses"     icon={<KeyRound size={12} />}      label="Licenses"     desc="All your keys" />
              <JumpRow href="/dashboard/applications" icon={<Boxes size={12} />}         label="Applications" desc="Your auth apps" />
              <JumpRow href="/dashboard/balance"      icon={<Wallet size={12} />}        label="Top-up"       desc="Add wallet credit" />
              <JumpRow href="/dashboard/tickets"      icon={<MessageSquare size={12} />} label="Tickets"      desc="Support" />
              <JumpRow href="/dashboard/docs"         icon={<BookOpen size={12} />}      label="Docs"         desc="SDK integration" />
              <JumpRow href="/status"                 icon={<Zap size={12} />}           label="System status" desc="All systems" />
            </div>
          </div>

          {/* Recent wallet activity */}
          {txns.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--hairline)' }}>
                <p className="font-semibold text-[13.5px] flex items-center gap-2">
                  <Wallet size={12} className="text-[var(--brand)]" /> Recent wallet
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--hairline)' }}>
                {txns.map(t => (
                  <div key={t.id} className="px-5 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-mono uppercase tracking-wider text-[var(--fg-mute)]">{t.type.replace(/_/g, ' ')}</p>
                      {t.description && <p className="text-[11px] text-[var(--fg-dim)] truncate">{t.description}</p>}
                    </div>
                    <span className={`text-[12.5px] font-bold tabular-nums shrink-0 ${t.amount_cents >= 0 ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                      {t.amount_cents >= 0 ? '+' : ''}{formatPrice(t.amount_cents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discord */}
          <div
            className="card overflow-hidden p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(88,101,242,0.15), rgba(114,137,218,0.10))',
              border: '1px solid rgba(88,101,242,0.30)',
            }}
          >
            <div className="flex items-start gap-3">
              <svg viewBox="0 0 71 55" width="22" height="22" fill="#fff" className="mt-0.5 shrink-0">
                <path d="M60.1 4.9C55.6 2.8 50.7 1.3 45.7 0.4c-.7 1.1-1.4 2.6-1.9 3.7-5.5-.8-10.9-.8-16.3 0-.5-1.1-1.2-2.6-1.9-3.7C20.3 1.3 15.4 2.8 10.9 4.9 1.6 18.7-1 32.1.3 45.4c6.1 4.5 12 7.2 17.8 9 1.4-1.9 2.6-3.9 3.6-5.9-2-.7-3.8-1.6-5.6-2.7.5-.3.9-.6 1.3-.9 11.6 5.3 24.2 5.3 35.7 0 .4.3.8.6 1.3.9-1.8 1-3.6 2-5.6 2.7 1.1 2 2.3 3.9 3.6 5.9 5.8-1.8 11.7-4.5 17.8-9 1.5-15.3-2.5-28.6-10.5-40.5zM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.2 6.4 7.2c0 4-2.8 7.2-6.4 7.2zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.2 6.4 7.2c0 4-2.8 7.2-6.4 7.2z"/>
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-[13.5px] mb-0.5">Join our Discord</p>
                <p className="text-[11.5px] text-[var(--fg-dim)] mb-3 leading-snug">
                  Real-time updates, support, and free $1 wallet credit when you link.
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
          </div>
        </div>
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

function StatusRow({ label, value, accent, last }: { label: string; value: string; accent?: 'ok' | 'warn'; last?: boolean }) {
  const c = accent === 'ok' ? 'var(--ok)' : accent === 'warn' ? 'var(--warn)' : 'var(--fg)'
  return (
    <div
      className={`flex items-center justify-between gap-3 py-2 ${last ? '' : 'border-b'}`}
      style={!last ? { borderColor: 'var(--hairline)' } : undefined}
    >
      <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--fg-mute)]">{label}</span>
      <span className="text-[14px] font-bold tabular-nums" style={{ color: c, letterSpacing: '-0.02em' }}>
        {value}
      </span>
    </div>
  )
}

function JumpRow({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-[var(--surface-2)] transition-colors group"
    >
      <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
        style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight">{label}</p>
        <p className="text-[11px] text-[var(--fg-mute)] leading-tight">{desc}</p>
      </div>
      <ChevronRight size={12} className="text-[var(--fg-mute)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}
