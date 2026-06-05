import { Resend } from 'resend'

/**
 * Resend transactional email client.
 * Lazy-instantiated so the module doesn't crash at import time
 * if RESEND_API_KEY is missing in dev.
 */

let _client: Resend | null = null

export function resend(): Resend {
  if (_client) return _client
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('Missing RESEND_API_KEY in environment.')
  _client = new Resend(key)
  return _client
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Onyx Services <noreply@onyx.gg>'

export interface SendInput {
  to:       string | string[]
  subject:  string
  html:     string
  text?:    string
  /** Optional internal tag for log routing (e.g. "welcome", "purchase-receipt") */
  tag?:     string
}

export async function sendEmail(input: SendInput) {
  const { data, error } = await resend().emails.send({
    from:    EMAIL_FROM,
    to:      input.to,
    subject: input.subject,
    html:    input.html,
    text:    input.text,
    tags:    input.tag ? [{ name: 'category', value: input.tag }] : undefined,
  })
  if (error) throw new Error(`Email send failed: ${error.message}`)
  return data
}
