import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Lock } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { TwoFactorSetup } from './TwoFactorSetup'

export const metadata = { title: 'Two-factor authentication' }
export const dynamic = 'force-dynamic'

interface Profile {
  username:           string
  two_factor_enabled?: boolean
}

interface Factor {
  id:           string
  factor_type:  string
  status:       string
  friendly_name: string | null
  created_at:   string
}

export default async function TwoFactorPage() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/account/two-factor')

  const { data: baseRaw } = await supa
    .from('profiles').select('username').eq('id', user.id).maybeSingle()

  let twoFactorEnabled = false
  try {
    const { data: extRaw, error } = await supa
      .from('profiles').select('two_factor_enabled').eq('id', user.id).maybeSingle()
    if (!error && extRaw) twoFactorEnabled = (extRaw as Profile).two_factor_enabled ?? false
  } catch {}

  const profile = (baseRaw ?? null) as Profile | null

  // Pull current MFA factors
  const { data: mfaRaw } = await supa.auth.mfa.listFactors()
  const factors = (mfaRaw?.totp ?? []) as Factor[]
  const verified = factors.find(f => f.status === 'verified')

  return (
    <div className="animate-in max-w-[640px]">
      <Link href="/dashboard/account" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 mb-4">
        <ChevronLeft size={13} /> Account
      </Link>

      <div className="mb-8">
        <p className="label-mono mb-2">Security</p>
        <h1 className="text-[24px] font-bold tracking-tight flex items-center gap-2">
          <Lock size={20} className="text-[var(--brand)]" />
          Two-factor authentication
        </h1>
        <p className="text-[13.5px] text-[var(--fg-dim)] mt-1 leading-relaxed">
          Add a second layer to your sign-in. Even if someone gets your password, they can&apos;t log in without your authenticator app.
        </p>
      </div>

      <TwoFactorSetup
        enabled={twoFactorEnabled || !!verified}
        username={profile?.username ?? 'OP user'}
        existingFactorId={verified?.id ?? null}
      />
    </div>
  )
}
