import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { Topbar } from '@/components/Topbar'
import { AdminSidebar } from './AdminSidebar'
import { AntiInspect } from '@/components/AntiInspect'

interface Profile {
  username:      string
  balance_cents: number
  role:          string
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('username, balance_cents, role')
    .eq('id', user.id)
    .single()

  const profile = (profileRaw ?? null) as Profile | null
  if (!profile || (profile.role !== 'super_admin' && profile.role !== 'support')) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AntiInspect />
      <Topbar
        username={profile.username}
        balanceCents={Number(profile.balance_cents)}
        isAdmin
      />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 py-8">
          <div className="px-6 md:px-10 max-w-[1280px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
