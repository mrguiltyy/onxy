'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'

export async function markAllRead(): Promise<{ ok: boolean }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false }

  await supa.from('notifications')
    .update({ is_read: true } as never)
    .eq('user_id', user.id)
    .eq('is_read', false)

  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function markOneRead(notifId: string): Promise<{ ok: boolean }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false }

  await supa.from('notifications')
    .update({ is_read: true } as never)
    .eq('id', notifId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/notifications')
  return { ok: true }
}
