'use server'

import { resetHwid } from '../licenses/[id]/actions'

/**
 * Thin re-export so the wizard doesn't have to import from
 * the licenses/[id] route directory directly.
 */
export async function resetHwidFromTroubleshoot(licenseId: string) {
  return resetHwid(licenseId)
}
