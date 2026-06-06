'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

interface AdminRole { role: string }

async function requireAdmin() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single<AdminRole>()
  if (!data || (data.role !== 'super_admin' && data.role !== 'support')) redirect('/dashboard')
  return user
}

export async function createAnnouncement(fd: FormData) {
  const user = await requireAdmin()
  const message    = (fd.get('message')    as string ?? '').trim()
  const variant    = (fd.get('variant')    as string) || 'info'
  const linkUrl    = (fd.get('link_url')   as string ?? '').trim() || null
  const linkLabel  = (fd.get('link_label') as string ?? '').trim() || null

  if (!message) return

  // Deactivate previous announcements first (only the latest active one shows)
  await supabaseAdmin()
    .from('announcements')
    .update({ is_active: false } as never)
    .eq('is_active', true)

  await supabaseAdmin().from('announcements').insert({
    message,
    variant,
    link_url:   linkUrl,
    link_label: linkLabel,
    is_active:  true,
    created_by: user.id,
  } as never)

  revalidatePath('/admin/announcements')
  revalidatePath('/dashboard')
}

export async function toggleAnnouncement(fd: FormData) {
  await requireAdmin()
  const id     = fd.get('id') as string
  const active = fd.get('active') === 'true'
  if (!id) return

  await supabaseAdmin()
    .from('announcements')
    .update({ is_active: !active } as never)
    .eq('id', id)

  revalidatePath('/admin/announcements')
  revalidatePath('/dashboard')
}
