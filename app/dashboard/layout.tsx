import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { Topbar } from '@/components/Topbar'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { AntiInspect } from '@/components/AntiInspect'

interface Profile {
  username:      string
  balance_cents: number
  role:          string
  avatar_url?:   string | null
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
    .select('username, balance_cents, role, avatar_url')
    .eq('id', user.id)
    .single()

  const profile = (profileRaw ?? null) as Profile | null

  // Notifications — last 10 for the bell dropdown, plus unread count
  const { data: notifsRaw } = await supabase
    .from('notifications')
    .select('id, type, title, body, link_url, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  const notifications = (notifsRaw ?? []) as Array<{
    id: string; type: string; title: string; body: string | null
    link_url: string | null; is_read: boolean; created_at: string
  }>

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

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
  const canManageApps = profile?.role === 'super_admin' || profile?.role === 'reseller'

  return (
    <div className="min-h-screen flex flex-col">
      <AntiInspect />
      <Topbar
        username={profile?.username ?? user.email?.split('@')[0] ?? 'User'}
        balanceCents={Number(profile?.balance_cents ?? 0)}
        isAdmin={isAdmin}
        canManageApps={canManageApps}
        avatarUrl={profile?.avatar_url ?? null}
        notifications={notifications}
        unreadCount={unreadCount ?? 0}
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
