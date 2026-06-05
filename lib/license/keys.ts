import { createHash, randomBytes, timingSafeEqual } from 'crypto'

/**
 * License key utilities.
 *
 * Format: ONYX-XXXX-XXXX-XXXX-XXXX
 *   16 chars of alphanumeric data, no I/O/0/1 to avoid confusion.
 *   ~32 bits of entropy per segment, ~128 bits total.
 *
 * Storage: we never store the plaintext key. We store sha256(key)
 * in licenses.key_lookup_hash and look up by that. The user sees
 * the plaintext key once on issuance.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1
const SEGMENT_LEN = 4
const SEGMENTS    = 4
const PREFIX      = 'ONYX'

/**
 * Generate a fresh license key using crypto-safe randomness.
 * Returns the human-readable plaintext: "ONYX-A1B2-C3D4-E5F6-G7H8"
 */
export function generateKey(): string {
  const bytes = randomBytes(SEGMENT_LEN * SEGMENTS)
  const segments: string[] = []
  for (let s = 0; s < SEGMENTS; s++) {
    let seg = ''
    for (let i = 0; i < SEGMENT_LEN; i++) {
      seg += ALPHABET[bytes[s * SEGMENT_LEN + i] % ALPHABET.length]
    }
    segments.push(seg)
  }
  return `${PREFIX}-${segments.join('-')}`
}

/**
 * Normalize user input — uppercase, strip whitespace, validate format.
 * Returns the canonical key or null if malformed.
 */
export function normalizeKey(input: string): string | null {
  if (typeof input !== 'string') return null

  const cleaned = input.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '')

  // Allow either "ONYX-AAAA-BBBB-CCCC-DDDD" or "ONYXAAAABBBBCCCCDDDD"
  const segments = cleaned.includes('-')
    ? cleaned.split('-')
    : [cleaned.slice(0, 4), cleaned.slice(4, 8), cleaned.slice(8, 12), cleaned.slice(12, 16), cleaned.slice(16, 20)]

  if (segments.length !== SEGMENTS + 1) return null
  if (segments[0] !== PREFIX) return null
  if (segments.slice(1).some(s => s.length !== SEGMENT_LEN)) return null

  // Reject anything outside the alphabet
  if (segments.slice(1).some(s => !/^[A-HJ-NP-Z2-9]+$/.test(s))) return null

  return segments.join('-')
}

/**
 * SHA-256 hash for DB lookup. Deterministic — same input → same output.
 */
export function hashKey(plaintextKey: string): string {
  return createHash('sha256').update(plaintextKey).digest('hex')
}

/**
 * Constant-time comparison of two strings. Prevents timing attacks
 * where an attacker measures response time to learn how many chars matched.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

/**
 * Return just the prefix (first 8 chars, e.g. "ONYX-A1B2") for UI display.
 * Used when we want to show "your key starts with ..." without revealing it.
 */
export function keyPrefix(plaintextKey: string): string {
  return plaintextKey.slice(0, 9) // "ONYX-" + 4 chars
}
