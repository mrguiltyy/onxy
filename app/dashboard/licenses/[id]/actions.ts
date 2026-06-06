'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

interface License {
  id:                 string
  user_id:            string
  banned:             boolean
  status:             string
  hwid_reset_count:   number
  last_hwid_reset_at: string | null
  max_hwid_resets:    number
}

export async function resetHwid(licenseId: string): Promise<{ ok: boolean; error?: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  // Pull the license (ensures it's owned by user via RLS)
  const { data: lRaw } = await supa
    .from('licenses')
    .select('id, user_id, banned, status, hwid_reset_count, last_hwid_reset_at, max_hwid_resets')
    .eq('id', licenseId)
    .eq('user_id', user.id)
    .maybeSingle()
  const lic = lRaw as License | null
  if (!lic) return { ok: false, error: 'License not found.' }

  if (lic.banned)                  return { ok: false, error: 'This license is banned and cannot be reset.' }
  if (lic.status === 'expired')    return { ok: false, error: 'Expired licenses cannot be reset. Renew first.' }

  // Lifetime cap
  if (lic.hwid_reset_count >= lic.max_hwid_resets) {
    return { ok: false, error: `You've used all ${lic.max_hwid_resets} resets for this license. Open a ticket for help.` }
  }

  // 24h cooldown
  if (lic.last_hwid_reset_at) {
    const since = Date.now() - new Date(lic.last_hwid_reset_at).getTime()
    if (since < 24 * 60 * 60 * 1000) {
      const hours = Math.ceil((24 * 60 * 60 * 1000 - since) / 3_600_000)
      return { ok: false, error: `Wait ${hours}h before resetting again.` }
    }
  }

  // Perform reset using service role (we need to delete sessions + clear hwid in one transaction-ish flow)
  const admin = supabaseAdmin()
  const now = new Date().toISOString()

  // Clear HWID + bind metadata
  const { error: upErr } = await admin.from('licenses')
    .update({
      hwid:               null,
      hwid_locked_at:     null,
      hwid_reset_count:   lic.hwid_reset_count + 1,
      last_hwid_reset_at: now,
    } as never)
    .eq('id', licenseId)
  if (upErr) return { ok: false, error: upErr.message }

  // Kill any active sessions
  await admin.from('auth_sessions').delete().eq('license_id', licenseId)

  // Log it
  await admin.from('auth_logs').insert({
    license_id: licenseId,
    event_type: 'hwid_reset_self',
    code:       null,
    ip:         null,
    hwid:       null,
  } as never)

  revalidatePath(`/dashboard/licenses/${licenseId}`)
  revalidatePath('/dashboard/licenses')
  return { ok: true }
}
