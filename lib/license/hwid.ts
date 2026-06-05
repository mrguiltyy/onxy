import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * HWID slot management.
 *
 * A license has N HWID slots (default 2). The first time a given hwid
 * authenticates against a license, it claims an open slot. If all slots
 * are full and the new hwid doesn't match an existing one, auth fails.
 *
 * Resets are admin-driven via a separate endpoint.
 */

export type ClaimResult =
  | { ok: true;  hwidId: string; isNewlyRegistered: boolean }
  | { ok: false; code: 'HWID_LIMIT' }

/**
 * Atomically check if this hwid is already registered for the license,
 * or claim a fresh slot if one is available.
 *
 * Returns the hwid_registry row id on success.
 */
export async function getOrClaimHwid(opts: {
  licenseId: string
  hwidHash:  string
  ip:        string
}): Promise<ClaimResult> {
  const db = supabaseAdmin()

  interface HwidRow { id: string; is_active: boolean }

  // Step 1: existing match?
  const { data: existing } = await db
    .from('hwid_registry')
    .select('id, is_active')
    .eq('license_id', opts.licenseId)
    .eq('hwid_hash', opts.hwidHash)
    .maybeSingle<HwidRow>()

  if (existing) {
    if (!existing.is_active) {
      return { ok: false, code: 'HWID_LIMIT' }
    }
    // touch last_seen + last_ip
    await db.from('hwid_registry').update({
      last_seen_at: new Date().toISOString(),
      last_ip:      opts.ip,
    } as never).eq('id', existing.id)

    return { ok: true, hwidId: existing.id, isNewlyRegistered: false }
  }

  interface LicenseSlotRow { hwid_slots_used: number; hwid_slots_total: number }

  // Step 2: any open slot? Get current count + cap from license
  const { data: license } = await db
    .from('licenses')
    .select('hwid_slots_used, hwid_slots_total')
    .eq('id', opts.licenseId)
    .single<LicenseSlotRow>()

  if (!license) return { ok: false, code: 'HWID_LIMIT' }

  if (license.hwid_slots_used >= license.hwid_slots_total) {
    return { ok: false, code: 'HWID_LIMIT' }
  }

  // Step 3: claim — insert hwid row + increment slot count.
  // We do these in sequence; the unique index on (license_id, hwid_hash)
  // protects against double-insert races.
  interface InsertedHwidRow { id: string }
  const { data: inserted, error: insertErr } = await db
    .from('hwid_registry')
    .insert({
      license_id:    opts.licenseId,
      hwid_hash:     opts.hwidHash,
      registered_at: new Date().toISOString(),
      last_seen_at:  new Date().toISOString(),
      last_ip:       opts.ip,
      is_active:     true,
    } as never)
    .select('id')
    .single<InsertedHwidRow>()

  if (insertErr || !inserted) {
    // Race condition — try the lookup again
    const { data: retry } = await db
      .from('hwid_registry')
      .select('id, is_active')
      .eq('license_id', opts.licenseId)
      .eq('hwid_hash', opts.hwidHash)
      .single<HwidRow>()

    if (retry?.is_active) {
      return { ok: true, hwidId: retry.id, isNewlyRegistered: false }
    }
    return { ok: false, code: 'HWID_LIMIT' }
  }

  await db
    .from('licenses')
    .update({ hwid_slots_used: license.hwid_slots_used + 1 } as never)
    .eq('id', opts.licenseId)

  return { ok: true, hwidId: inserted.id, isNewlyRegistered: true }
}

/**
 * Reset all HWIDs on a license (called by admin or via support ticket approval).
 * Frees up all slots for re-registration.
 */
export async function resetAllHwids(licenseId: string): Promise<void> {
  const db = supabaseAdmin()

  await db
    .from('hwid_registry')
    .update({ is_active: false } as never)
    .eq('license_id', licenseId)
    .eq('is_active', true)

  await db
    .from('licenses')
    .update({ hwid_slots_used: 0 } as never)
    .eq('id', licenseId)
}

/**
 * Reset a specific HWID (e.g. user removed an old machine).
 */
export async function resetSingleHwid(hwidId: string): Promise<void> {
  const db = supabaseAdmin()

  interface HwidLookupRow { license_id: string; is_active: boolean }
  interface SlotCountRow { hwid_slots_used: number }

  const { data: hwid } = await db
    .from('hwid_registry')
    .select('license_id, is_active')
    .eq('id', hwidId)
    .single<HwidLookupRow>()

  if (!hwid || !hwid.is_active) return

  await db.from('hwid_registry').update({ is_active: false } as never).eq('id', hwidId)

  const { data: license } = await db
    .from('licenses')
    .select('hwid_slots_used')
    .eq('id', hwid.license_id)
    .single<SlotCountRow>()

  if (license) {
    await db
      .from('licenses')
      .update({ hwid_slots_used: Math.max(0, license.hwid_slots_used - 1) } as never)
      .eq('id', hwid.license_id)
  }
}
