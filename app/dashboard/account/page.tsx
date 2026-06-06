import Link from 'next/link'
import { LogOut, User as UserIcon, Mail, Wallet, Hash, Store, ArrowRight, ShieldCheck } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils'

interface Profile {
  username:      string
  email:         string
  balance_cents: number
  role:          string
  parent_id:     string
  created_at:    string
}

export default async function AccountPage() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('username, email, balance_cents, role, parent_id, created_at')
    .eq('id', user!.id)
    .single()

  const profile = (profileRaw ?? null) as Profile | null

  return (
    <div className="animate-in max-w-[640px]">
      <h1 className="text-[22px] font-bold tracking-tight mb-6">Account</h1>

      <div className="card p-6 mb-5">
        <div className="flex items-center gap-4 pb-5 mb-5 border-b border-[var(--hairline)]">
          <div
            className="w-14 h-14 rounded-md flex items-center justify-center text-white text-[20px] font-bold"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-hover))' }}
          >
            {(profile?.username ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-[17px] font-bold">{profile?.username}</h2>
            <p className="text-[12.5px] text-[var(--fg-dim)]">{profile?.email}</p>
          </div>
          <span className="pill pill-brand">{profile?.role ?? 'user'}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Row icon={<UserIcon size={13} />} label="Username"   value={profile?.username ?? '—'} />
          <Row icon={<Mail     size={13} />} label="Email"      value={profile?.email ?? '—'} />
          <Row icon={<Wallet   size={13} />} label="Balance"    value={formatPrice(profile?.balance_cents ?? 0)} accent="ok" />
          <Row icon={<Hash     size={13} />} label="Parent ID"  value={profile?.parent_id ?? '#1'} />
          <Row icon={<Hash     size={13} />} label="Member since" value={profile?.created_at ? formatDate(profile.created_at) : '—'} />
        </div>
      </div>

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

      <div className="card p-6">
        <h2 className="font-semibold mb-1">Sign out</h2>
        <p className="text-[13px] text-[var(--fg-dim)] mb-4">End your session on this device.</p>
        <form action="/auth/signout" method="POST">
          <button type="submit" className="btn btn-danger">
            <LogOut size={14} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

function Row({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: 'ok' }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] text-[var(--fg-mute)] uppercase tracking-wider">
        {icon}
        {label}
      </p>
      <p className={`text-[14px] font-semibold mt-1 ${accent === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--fg)]'}`}>{value}</p>
    </div>
  )
}
