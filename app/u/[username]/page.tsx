import { notFound } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Calendar, Activity, Store, Crown, ShieldCheck, ArrowRight } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin } from '@/lib/supabase/server'
import { relativeTime, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Profile {
  id:               string
  username:         string
  role:             string
  created_at:       string
  // Optional onboarding columns
  avatar_url?:      string | null
  banner_url?:      string | null
  bio?:             string | null
  profile_public?:  boolean
  tier?:            string | null
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const admin = supabaseAdmin()
  const { data } = await admin
    .from('profiles')
    .select('username, bio, avatar_url')
    .eq('username', username)
    .maybeSingle()
  const p = data as { username: string; bio: string | null; avatar_url: string | null } | null
  if (!p) return { title: 'Profile not found · OP' }
  return {
    title:       `@${p.username} on OP`,
    description: p.bio ?? `${p.username}'s OP profile.`,
    openGraph: {
      title: `@${p.username}`,
      description: p.bio ?? `${p.username}'s public OP profile.`,
      images: p.avatar_url ? [p.avatar_url] : undefined,
    },
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const admin = supabaseAdmin()

  // Fetch base profile columns first (always exist)
  const { data: baseRaw } = await admin
    .from('profiles')
    .select('id, username, role, created_at')
    .eq('username', username)
    .maybeSingle()

  if (!baseRaw) notFound()

  // Optional onboarding columns
  let ext: Partial<Profile> = {}
  try {
    const { data: extRaw, error } = await admin
      .from('profiles')
      .select('avatar_url, banner_url, bio, profile_public, tier')
      .eq('username', username)
      .maybeSingle()
    if (!error && extRaw) ext = extRaw as Partial<Profile>
  } catch { /* columns not yet added */ }

  const profile = { ...(baseRaw as Record<string, unknown>), ...ext } as Profile

  // If profile is explicitly private → 404 (don't leak existence)
  if (profile.profile_public === false) notFound()

  // Public stats
  const [{ count: totalKeys }, { count: appsCount }] = await Promise.all([
    admin.from('licenses').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
    admin.from('applications').select('id', { count: 'exact', head: true }).eq('owner_id', profile.id),
  ])

  // Recent public activity — only event types that are safe to show
  const { data: actsRaw } = await admin
    .from('activity')
    .select('event_type, target_label, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(6)
  const recentActs = (actsRaw as { event_type: string; target_label: string | null; created_at: string }[] | null) ?? []

  return (
    <PublicShell wide>
      {/* Banner */}
      <div
        className="rounded-xl h-48 md:h-56 relative overflow-hidden mb-12"
        style={{
          background: profile.banner_url
            ? `url(${profile.banner_url}) center/cover`
            : 'linear-gradient(135deg, rgba(240,164,183,0.25), rgba(162,200,238,0.25), rgba(168,85,247,0.15))',
          border: '1px solid var(--hairline)',
        }}
      >
        {/* Avatar overlapping the banner edge */}
        <div className="absolute -bottom-12 left-6 md:left-10">
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-[36px] font-bold border-4"
            style={{
              background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'var(--brand-gradient)',
              color: '#3a2630',
              borderColor: 'var(--bg)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            }}
          >
            {!profile.avatar_url && profile.username[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Identity row */}
      <div className="px-6 md:px-10 mb-10 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight" style={{ letterSpacing: '-0.025em' }}>
              @{profile.username}
            </h1>
            <RoleBadge role={profile.role} />
            {profile.tier && profile.tier !== 'free' && <TierBadge tier={profile.tier} />}
          </div>
          <p className="text-[13px] text-[var(--fg-mute)] inline-flex items-center gap-1.5">
            <Calendar size={11} /> Member since {formatDate(profile.created_at)}
          </p>
        </div>
        <Link href="/register" className="btn btn-secondary btn-sm">Join OP</Link>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="px-6 md:px-10 mb-8">
          <p className="text-[14.5px] text-[var(--fg-dim)] leading-relaxed max-w-[640px] whitespace-pre-wrap">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="px-6 md:px-10 mb-10">
        <div className="grid grid-cols-3 gap-4 max-w-[480px]">
          <Stat label="Total keys"  value={(totalKeys ?? 0).toLocaleString()} icon={<KeyRound size={13} />} />
          <Stat label="Projects"     value={(appsCount ?? 0).toLocaleString()} icon={<Activity size={13} />} />
          <Stat label="Joined"       value={relativeTime(profile.created_at)} icon={<Calendar size={13} />} small />
        </div>
      </div>

      {/* Recent activity */}
      {recentActs.length > 0 && (
        <div className="px-6 md:px-10 mb-10">
          <p className="label-mono mb-3">Recent activity</p>
          <div className="card divide-y" style={{ borderColor: 'var(--hairline)' }}>
            {recentActs.map((a, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <span className="w-0.5 h-7 rounded-sm shrink-0 bg-[var(--brand)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium capitalize">{a.event_type.replace(/_/g, ' ')}</p>
                  {a.target_label && <p className="text-[11px] text-[var(--fg-mute)] font-mono truncate">{a.target_label}</p>}
                </div>
                <span className="text-[10.5px] text-[var(--fg-mute)] shrink-0">{relativeTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-6 md:px-10 mb-16">
        <div className="card p-6 flex items-center justify-between gap-4 flex-wrap"
          style={{
            background: 'radial-gradient(ellipse 600px 240px at 0% 0%, rgba(240,164,183,0.08), transparent 60%), var(--surface)',
          }}>
          <div className="min-w-0">
            <p className="font-semibold text-[14.5px] mb-0.5">Build with OP yourself</p>
            <p className="text-[12.5px] text-[var(--fg-dim)]">
              Buy tools, become a reseller, or embed our auth engine in your own apps.
            </p>
          </div>
          <Link href="/register" className="btn btn-primary btn-sm">
            Get started <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </PublicShell>
  )
}

function Stat({ label, value, icon, small }: { label: string; value: string; icon: React.ReactNode; small?: boolean }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 mb-1.5 text-[var(--fg-mute)]">
        {icon}
        <span className="text-[10.5px] uppercase tracking-wider font-bold">{label}</span>
      </div>
      <p className={`${small ? 'text-[14px]' : 'text-[20px]'} font-bold tabular-nums`} style={{ letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'super_admin') return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
      <Crown size={10} /> Admin
    </span>
  )
  if (role === 'reseller') return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
      <Store size={10} /> Reseller
    </span>
  )
  if (role === 'support') return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
      <ShieldCheck size={10} /> Support
    </span>
  )
  return null
}

function TierBadge({ tier }: { tier: string }) {
  const label = tier.charAt(0).toUpperCase() + tier.slice(1)
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{ background: 'rgba(168,85,247,0.10)', color: '#a855f7' }}>
      {label}
    </span>
  )
}
