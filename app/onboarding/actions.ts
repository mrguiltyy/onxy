'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

interface SavePayload {
  avatarUrl:     string
  bannerUrl:     string
  profilePublic: boolean
}

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

export async function saveOnboarding(p: SavePayload): Promise<{ ok: boolean; error?: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const admin = supabaseAdmin()
  const { error } = await admin
    .from('profiles')
    .update({
      avatar_url:     safeUrl(p.avatarUrl),
      banner_url:     safeUrl(p.bannerUrl),
      profile_public: !!p.profilePublic,
    } as never)
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/onboarding')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/account')
  return { ok: true }
}

export async function completeOnboarding(): Promise<{ ok: boolean; error?: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const admin = supabaseAdmin()
  const { error } = await admin
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() } as never)
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  return { ok: true }
}
