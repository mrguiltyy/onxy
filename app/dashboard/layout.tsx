import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { Topbar } from '@/components/Topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get profile row (created by trigger on signup)
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('username, balance_cents')
    .eq('id', user.id)
    .single()

  const profile = (profileRaw ?? null) as { username: string; balance_cents: number } | null

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar
        username={profile?.username ?? user.email?.split('@')[0] ?? 'User'}
        balanceCents={Number(profile?.balance_cents ?? 0)}
      />
      <main className="flex-1 py-8">
        <div className="container-x">
          {children}
        </div>
      </main>
    </div>
  )
}
