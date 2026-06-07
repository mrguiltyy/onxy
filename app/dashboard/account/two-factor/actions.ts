'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase/server'

/**
 * Flip `profiles.two_factor_enabled`. Called from the client after MFA
 * enroll/verify or after unenroll succeeds.
 *
 * Tolerant of the column not existing yet (returns ok=true silently).
 */
export async function setTwoFactorFlag(enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  try {
    const { error } = await supa
      .from('profiles')
      .update({ two_factor_enabled: enabled } as never)
      .eq('id', user.id)
    if (error && !error.message?.toLowerCase().includes('column')) {
      return { ok: false, error: error.message }
    }
  } catch { /* column missing — ignore */ }

  revalidatePath('/dashboard/account')
  revalidatePath('/dashboard/account/two-factor')
  return { ok: true }
}
