import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/cron'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/cron/expiring-licenses
 * Runs daily at 09:00 UTC.
 *
 * Sends "expiring soon" email to anyone whose license expires in 3 days.
 * Lazy-imports the email module so missing RESEND_API_KEY doesn't break
 * unrelated cron jobs.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const db   = supabaseAdmin()
  const now  = new Date()
  const lo   = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const hi   = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)

  interface LicRow {
    id:          string
    user_id:     string
    product_id:  string
    expires_at:  string
  }

  const { data: licenses } = await db
    .from('licenses')
    .select('id, user_id, product_id, expires_at')
    .eq('status', 'active')
    .gte('expires_at', lo.toISOString())
    .lte('expires_at', hi.toISOString())
    .returns<LicRow[]>()

  let sent = 0

  for (const lic of (licenses ?? [])) {
    interface UserRow { username: string; email: string }
    interface ProductRow { name: string }

    const { data: user } = await db.from('users').select('username, email').eq('id', lic.user_id).single<UserRow>()
    if (!user) continue

    const { data: product } = await db.from('products').select('name').eq('id', lic.product_id).single<ProductRow>()
    if (!product) continue

    try {
      const { sendExpiringSoon } = await import('@/lib/email')
      await sendExpiringSoon(user.email, user.username, product.name, 3)
      sent++
    } catch (err) {
      // email service unavailable — skip silently
      console.error('expiring-licenses email failed', err)
    }
  }

  return NextResponse.json({ ok: true, sent, checked: licenses?.length ?? 0 })
}
