import { NextRequest } from 'next/server'

/**
 * Verifies a cron request came from Vercel's scheduler.
 * Vercel sets `Authorization: Bearer <CRON_SECRET>` automatically
 * when the env var is configured. Reject anything else.
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false                  // require explicit secret in prod
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${expected}`
}
