import { supabaseAdmin } from '@/lib/supabase/server'
import { generateKey, hashKey, keyPrefix } from './keys'

/**
 * Server-side license issuance.
 *
 * Called by:
 *   • Stripe webhook (on payment success)
 *   • Wallet checkout (on balance deduction)
 *   • Redeem code endpoint (when reward is a license)
 *   • Admin "force-add license" UI
 *
 * Returns the plaintext key — this is the ONLY moment the user sees it.
 * After this, only the hash is stored. The plaintext should be:
 *   1. Returned to the buyer via dashboard / email
 *   2. Never persisted server-side after this function returns
 */

export interface IssueLicenseInput {
  userId:        string
  productId:     string
  planId?:       string | null
  durationDays?: number | null         // null = lifetime
  hwidSlots?:    number                // override product default
  autoRenew?:    boolean
}

export interface IssuedLicense {
  id:        string
  key:       string         // plaintext — show to user, then forget
  keyPrefix: string         // safe for logs / display ("ONYX-A1B2")
  expiresAt: string | null
}

export async function issueLicense(input: IssueLicenseInput): Promise<IssuedLicense> {
  const db = supabaseAdmin()

  // Generate a unique key — retry on the absurdly-unlikely collision
  let plaintext: string
  let lookupHash: string
  for (let attempt = 0; attempt < 5; attempt++) {
    plaintext  = generateKey()
    lookupHash = hashKey(plaintext)
    const { data: clash } = await db
      .from('licenses')
      .select('id')
      .eq('key_lookup_hash', lookupHash)
      .maybeSingle()
    if (!clash) break
    if (attempt === 4) throw new Error('Could not generate unique key after 5 attempts')
  }

  // Default HWID slots from product if not provided
  interface ProductSlotsRow { max_hwid_slots: number }
  let slots = input.hwidSlots
  if (slots === undefined) {
    const { data: product } = await db
      .from('products')
      .select('max_hwid_slots')
      .eq('id', input.productId)
      .single<ProductSlotsRow>()
    slots = product?.max_hwid_slots ?? 2
  }

  const expiresAt = input.durationDays
    ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  interface InsertedLicenseRow { id: string }
  const { data: license, error } = await db
    .from('licenses')
    .insert({
      user_id:           input.userId,
      product_id:        input.productId,
      plan_id:           input.planId ?? null,
      key_lookup_hash:   lookupHash!,
      key_prefix:        keyPrefix(plaintext!),
      status:            'active',
      auto_renew:        input.autoRenew ?? false,
      hwid_slots_used:   0,
      hwid_slots_total:  slots,
      expires_at:        expiresAt,
    } as never)
    .select('id')
    .single<InsertedLicenseRow>()

  if (error || !license) {
    throw new Error(`Failed to issue license: ${error?.message ?? 'unknown'}`)
  }

  return {
    id:        license.id,
    key:       plaintext!,
    keyPrefix: keyPrefix(plaintext!),
    expiresAt,
  }
}

/**
 * Lower-level: rotate a license key (issue a new one for the same license row).
 * Used when a user requests a key reset for security reasons.
 */
export async function rotateLicenseKey(licenseId: string): Promise<{ key: string; keyPrefix: string }> {
  const db = supabaseAdmin()

  let plaintext: string
  let lookupHash: string
  for (let attempt = 0; attempt < 5; attempt++) {
    plaintext  = generateKey()
    lookupHash = hashKey(plaintext)
    const { data: clash } = await db
      .from('licenses')
      .select('id')
      .eq('key_lookup_hash', lookupHash)
      .maybeSingle()
    if (!clash) break
    if (attempt === 4) throw new Error('Could not generate unique key')
  }

  await db
    .from('licenses')
    .update({
      key_lookup_hash: lookupHash!,
      key_prefix:      keyPrefix(plaintext!),
    } as never)
    .eq('id', licenseId)

  // Kill all live sessions on the old key
  await db
    .from('license_sessions')
    .update({ expires_at: new Date(0).toISOString() } as never)
    .eq('license_id', licenseId)

  return { key: plaintext!, keyPrefix: keyPrefix(plaintext!) }
}
