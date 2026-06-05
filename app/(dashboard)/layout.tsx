import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { supabaseServer } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {

  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware already protects this, but belt-and-braces.
  if (!user) redirect('/login')

  interface ProfileRow {
    username:             string
    email:                string
    role:                 string
    tier:                 string
    wallet_balance_cents: number
  }

  // Pull profile row (created automatically by a Supabase trigger on user signup)
  const { data: profile } = await supabase
    .from('users')
    .select('username, email, role, tier, wallet_balance_cents')
    .eq('id', user.id)
    .single<ProfileRow>()

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        username={profile?.username ?? user.email?.split('@')[0] ?? 'You'}
        email={profile?.email   ?? user.email                       ?? ''}
        role={  (profile?.role  ?? 'user') as 'user' | 'reseller'}
      />
      <div className="pl-[240px]">
        <main className="min-h-screen p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
