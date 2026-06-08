import crypto from 'crypto'

/**
 * Seller API key format:  ops_<8-char-id>:<32-char-secret>
 *
 * The id part is the public prefix (looked up in the DB to find the seller).
 * The secret is hashed (SHA-256) and stored. The full key is never stored.
 *
 * Example: ops_a1b2c3d4:9f8e7d6c5b4a3210...
 */

export interface SellerKeyParts {
  prefix: string                 // 'ops_xxxxxxxx'
  secret: string                 // 32-char hex
  full:   string                 // 'ops_xxxxxxxx:yyyy...'
}

export function generateSellerKey(): SellerKeyParts {
  const prefix = 'ops_' + crypto.randomBytes(4).toString('hex')        // 8 hex chars
  const secret = crypto.randomBytes(20).toString('hex')                // 40 hex chars
  return {
    prefix,
    secret,
    full: `${prefix}:${secret}`,
  }
}

export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

export interface ParsedSellerKey {
  prefix: string
  secret: string
}

export function parseSellerKey(input: string): ParsedSellerKey | null {
  if (!input) return null
  const parts = input.split(':')
  if (parts.length !== 2) return null
  const [prefix, secret] = parts
  if (!prefix.startsWith('ops_')) return null
  if (prefix.length < 8) return null
  if (secret.length < 16) return null
  return { prefix, secret }
}

/** Constant-time secret comparison */
export function verifySecret(provided: string, storedHash: string): boolean {
  try {
    const hash = hashSecret(provided)
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash))
  } catch {
    return false
  }
}

/** Mask a key for display: "ops_a1b2c3d4:9f8e••••••••••••3210" */
export function maskKey(full: string): string {
  const parsed = parseSellerKey(full)
  if (!parsed) return full
  const visible = parsed.secret.slice(0, 4) + '••••••••••••' + parsed.secret.slice(-4)
  return `${parsed.prefix}:${visible}`
}

/** Generate a license key in OP-XXXX-XXXX-XXXX-XXXX format */
export function generateLicenseKey(pattern?: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  function block(n: number) {
    let out = ''
    for (let i = 0; i < n; i++) out += alphabet[crypto.randomInt(0, alphabet.length)]
    return out
  }

  if (pattern) {
    // Replace each * with a random alphabet char
    return pattern.replace(/\*/g, () => alphabet[crypto.randomInt(0, alphabet.length)])
  }

  return `OP-${block(4)}-${block(4)}-${block(4)}-${block(4)}`
}
