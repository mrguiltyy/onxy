import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { Topbar } from '@/components/Topbar'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { AntiInspect } from '@/components/AntiInspect'

interface Profile {
  username:      string
  balance_cents: number
  role:          string
}

interface Announcement {
  message:    string
  variant:    string
  link_url:   string | null
  link_label: string | null
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('username, balance_cents, role')
    .eq('id', user.id)
    .single()

  const profile = (profileRaw ?? null) as Profile | null

  // Latest active announcement (anyone signed-in can read via RLS)
  const { data: annRaw } = await supabase
    .from('announcements')
    .select('message, variant, link_url, link_label')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ann = (annRaw ?? null) as Announcement | null
  const variant = (ann?.variant ?? 'info') as 'info' | 'warn' | 'success' | 'brand'
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'support'

  return (
    <div className="min-h-screen flex flex-col">
      <AntiInspect />
      <Topbar
        username={profile?.username ?? user.email?.split('@')[0] ?? 'User'}
        balanceCents={Number(profile?.balance_cents ?? 0)}
        isAdmin={isAdmin}
      />
      {ann && (
        <AnnouncementBar
          message={ann.message}
          variant={variant}
          linkUrl={ann.link_url}
          linkLabel={ann.link_label}
        />
      )}
      <main className="flex-1 py-8">
        <div className="container-x">
          {children}
        </div>
      </main>
    </div>
  )
}
