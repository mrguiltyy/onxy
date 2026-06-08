import Link from 'next/link'
import { LogOut, User as UserIcon, Mail, Wallet, Hash, Store, ArrowRight, ShieldCheck, Bell, KeyRound, Lock } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils'
import { Pill } from '@/components/ui/Pill'
import { LinkDiscordSection } from './LinkDiscordSection'
import { AvatarEditor } from './AvatarEditor'
import { ReplayTourButton } from './ReplayTourButton'

export const dynamic = 'force-dynamic'

interface Profile {
  username:              string
  email:                 string
  balance_cents:         number
  role:                  string
  parent_id:             string
  created_at:            string
  discord_id?:           string | null
  discord_username?:     string | null
  discord_credit_given?: boolean
  avatar_url?:           string | null
  two_factor_enabled?:   boolean
}

export default async function AccountPage() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  // Base columns
  const { data: baseRaw } = await supabase
    .from('profiles')
    .select('username, email, balance_cents, role, parent_id, created_at')
    .eq('id', user!.id)
    .maybeSingle()

  // Optional extended columns
  let extras: Partial<Profile> = {}
  try {
    const { data: extRaw, error: extErr } = await supabase
      .from('profiles')
      .select('discord_id, discord_username, discord_credit_given, avatar_url, two_factor_enabled')
      .eq('id', user!.id)
      .maybeSingle()
    if (!extErr && extRaw) extras = extRaw as Partial<Profile>
  } catch {}

  const profile = (baseRaw ? { ...baseRaw, ...extras } : null) as Profile | null

  return (
    <div className="animate-in max-w-[720px]">
      <div className="mb-6">
        <p className="label-mono mb-2">Account</p>
        <h1 className="text-[24px] font-bold tracking-tight">Profile &amp; settings</h1>
        <p className="text-[13px] text-[var(--fg-dim)] mt-1">Manage your identity, wallet, integrations, and session.</p>
      </div>

      {/* Identity */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between gap-4 pb-5 mb-5 border-b flex-wrap" style={{ borderColor: 'var(--hairline)' }}>
          <AvatarEditor
            username={profile?.username ?? 'U'}
            currentUrl={profile?.avatar_url ?? null}
          />
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <h2 className="text-[16px] font-bold truncate">{profile?.username}</h2>
              <p className="text-[11.5px] text-[var(--fg-dim)] truncate font-mono">{profile?.email}</p>
            </div>
            <RoleBadge role={profile?.role ?? 'user'} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Row icon={<UserIcon size={11} />} label="Username" value={profile?.username ?? '—'} />
          <Row icon={<Mail size={11} />} label="Email" value={profile?.email ?? '—'} />
          <Row icon={<Hash size={11} />} label="Member since" value={profile?.created_at ? formatDate(profile.created_at) : '—'} />
          <Row icon={<Wallet size={11} />} label="Balance" value={formatPrice(profile?.balance_cents ?? 0)} accent="ok" />
          <Row icon={<Hash size={11} />} label="Parent ID" value={profile?.parent_id ?? '#1'} />
          <Row icon={<KeyRound size={11} />} label="Account ID" value={(user!.id.slice(0, 8))} mono />
        </div>

        <div className="mt-5 pt-5 border-t flex items-center gap-3 flex-wrap" style={{ borderColor: 'var(--hairline)' }}>
          <Link href="/dashboard/balance" className="btn btn-secondary btn-sm">
            <Wallet size={11} /> Top up wallet
          </Link>
          <Link href="/dashboard/notifications" className="btn btn-secondary btn-sm">
            <Bell size={11} /> Notifications
          </Link>
          <Link href="/onboarding?skip=0" className="btn btn-secondary btn-sm">
            Re-run onboarding <ArrowRight size={11} />
          </Link>
          <ReplayTourButton />
        </div>
      </div>

      {/* Security */}
      <div className="card p-5 mb-5">
        <div className="flex items-start gap-4">
          <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
            style={{
              background: profile?.two_factor_enabled ? 'rgba(34,197,94,0.10)' : 'var(--brand-faint)',
              color:      profile?.two_factor_enabled ? 'var(--ok)' : 'var(--brand)',
            }}>
            <Lock size={16} />
          </span>
          <div className="flex-1">
            <p className="label-mono mb-1">Security</p>
            <h2 className="text-[15px] font-bold mb-1">
              Two-factor authentication
              {profile?.two_factor_enabled && (
                <span className="ml-2 text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded align-middle"
                  style={{ background: 'rgba(34,197,94,0.10)', color: 'var(--ok)' }}>ON</span>
              )}
            </h2>
            <p className="text-[12.5px] text-[var(--fg-dim)] mb-3 leading-relaxed">
              {profile?.two_factor_enabled
                ? 'Your account is protected with TOTP-based 2FA. You can disable it from the settings.'
                : 'Add a second factor to sign-in. Strongly recommended if you have wallet balance or active licenses.'}
            </p>
            <Link href="/dashboard/account/two-factor" className="btn btn-sm"
              style={profile?.two_factor_enabled
                ? { background: 'var(--surface-2)', color: 'var(--fg-dim)', border: '1px solid var(--hairline)' }
                : { background: 'var(--brand)', color: '#0a0d14', border: 'none' }}>
              {profile?.two_factor_enabled ? 'Manage 2FA' : 'Set up 2FA'} <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Discord link section */}
      <LinkDiscordSection
        linked={!!profile?.discord_id}
        username={profile?.discord_username ?? null}
        creditGiven={!!profile?.discord_credit_given}
      />

      {/* Reseller upsell — only show to regular users */}
      {profile?.role === 'user' && (
        <div className="card p-6 mb-5 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(240,164,183,0.06), rgba(162,200,238,0.06))',
        }}>
          <div className="flex items-start gap-4">
            <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
              <Store size={16} />
            </span>
            <div className="flex-1">
              <p className="label-mono mb-1">Reseller program</p>
              <h2 className="text-[16px] font-bold mb-1">Become a reseller</h2>
              <p className="text-[12.5px] text-[var(--fg-dim)] mb-4 leading-relaxed">
                Resell our tools at wholesale, use our auth engine for your own apps, and get instant update notifications.
                Starts at <strong className="text-[var(--brand)]">$14.99/mo</strong> or <strong className="text-[var(--brand)]">$99 lifetime</strong>.
              </p>
              <Link href="/reseller" className="btn btn-primary btn-sm">
                View plans <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Active reseller status */}
      {(profile?.role === 'reseller' || profile?.role === 'super_admin') && (
        <div className="card p-5 mb-5 flex items-center gap-3" style={{
          background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)',
        }}>
          <ShieldCheck size={16} className="text-[var(--ok)]" />
          <div className="flex-1">
            <p className="font-semibold text-[13px] text-[var(--ok)]">Reseller access active</p>
            <p className="text-[11.5px] text-[var(--fg-dim)]">Manage applications and white-labels in the dashboard.</p>
          </div>
          <Link href="/dashboard/applications" className="btn btn-secondary btn-sm">
            Applications <ArrowRight size={11} />
          </Link>
        </div>
      )}

      {/* Sign out */}
      <div className="card p-6">
        <h2 className="font-semibold mb-1">Sign out of OP</h2>
        <p className="text-[13px] text-[var(--fg-dim)] mb-4">End your session on this device. You can sign back in anytime.</p>
        <form action="/auth/signout" method="POST">
          <button type="submit" className="btn btn-sm" style={{
            background: 'rgba(239,68,68,0.08)',
            color: 'var(--bad)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}>
            <LogOut size={13} /> Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'super_admin') return <Pill tone="brand">Admin</Pill>
  if (role === 'support')     return <Pill tone="brand">Support</Pill>
  if (role === 'reseller')    return <Pill tone="brand">Reseller</Pill>
  return <Pill tone="pend">User</Pill>
}

function Row({ icon, label, value, accent, mono }: { icon: React.ReactNode; label: string; value: string; accent?: 'ok'; mono?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider mb-1">
        {icon}
        {label}
      </p>
      <p className={`text-[13.5px] font-semibold ${mono ? 'font-mono' : ''} ${accent === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--fg)]'}`}>{value}</p>
    </div>
  )
}
