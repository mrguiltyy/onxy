import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { supabaseServer } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {

  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check role
  interface RoleRow { role: string }
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<RoleRow>()

  if (!profile || (profile.role !== 'super_admin' && profile.role !== 'support')) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-bg">
      <AdminSidebar />
      <div className="pl-[240px]">
        <main className="min-h-screen p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
