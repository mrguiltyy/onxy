import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { OnboardingWizard } from './OnboardingWizard'

export const metadata = { title: 'Welcome · OP' }
export const dynamic = 'force-dynamic'

interface Profile {
  username:           string
  email:              string
  avatar_url:         string | null
  banner_url:         string | null
  bio:                string | null
  profile_public:     boolean
  onboarded_at:       string | null
  two_factor_enabled: boolean
  tier:               string
  created_at:         string
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ skip?: string }> }) {
  const params = await searchParams
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login?next=/onboarding')

  // Base columns from clean-install (always exist)
  const { data: baseRaw } = await supa
    .from('profiles')
    .select('username, email, created_at')
    .eq('id', user.id)
    .maybeSingle()
  if (!baseRaw) redirect('/login')

  // Try to read onboarding columns. If onboarding.sql hasn't been run, we
  // gracefully proceed with empty defaults — the wizard still works, it just
  // won't be able to persist until the SQL has run.
  let ext: Partial<Profile> = {}
  try {
    const { data: extRaw, error: extErr } = await supa
      .from('profiles')
      .select('avatar_url, banner_url, bio, profile_public, onboarded_at, two_factor_enabled, tier')
      .eq('id', user.id)
      .maybeSingle()
    if (!extErr && extRaw) ext = extRaw as Partial<Profile>
  } catch { /* onboarding.sql not run */ }

  const profile = { ...baseRaw, ...ext } as Profile

  // If already onboarded and not forced via ?skip=0, go to dashboard
  if (profile.onboarded_at && params.skip !== '0') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{
      background:
        'radial-gradient(ellipse 1200px 600px at 30% -10%, rgba(240,164,183,0.08), transparent 60%),' +
        'radial-gradient(ellipse 900px 600px at 80% 110%, rgba(162,200,238,0.08), transparent 65%),' +
        'var(--bg)',
    }}>
      <OnboardingWizard
        userId={user.id}
        username={profile.username}
        email={profile.email}
        createdAt={profile.created_at}
        initial={{
          avatar_url:         profile.avatar_url,
          banner_url:         profile.banner_url,
          bio:                profile.bio,
          profile_public:     profile.profile_public,
          two_factor_enabled: profile.two_factor_enabled,
          tier:               profile.tier,
        }}
      />
    </div>
  )
}
