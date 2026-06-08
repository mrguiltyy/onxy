'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

function safeUrl(u: string): string | null {
  const trimmed = u.trim()
  if (!trimmed) return null
  if (trimmed.length > 800) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return trimmed
  } catch { return null }
}

export async function updateAvatar(url: string): Promise<{ ok: boolean; error?: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const clean = url ? safeUrl(url) : null
  if (url && !clean) return { ok: false, error: 'Invalid URL.' }

  const admin = supabaseAdmin()
  const { error } = await admin
    .from('profiles')
    .update({ avatar_url: clean } as never)
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/account')
  return { ok: true }
}
