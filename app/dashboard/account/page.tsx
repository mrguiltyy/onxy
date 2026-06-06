import { LogOut, User as UserIcon, Mail, Wallet, Hash } from 'lucide-react'
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
