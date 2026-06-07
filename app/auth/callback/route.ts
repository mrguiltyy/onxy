import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`)

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(`${origin}/login?error=callback_failed`)

  // Check if this is a Discord sign-in/link — if so, attempt to grant the
  // $1 first-link bonus (idempotent via grant_discord_credit RPC).
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user needs onboarding (first signup, not yet onboarded)
  let needsOnboarding = false
  if (user) {
    const admin = supabaseAdmin()
    const { data: profRaw } = await admin
      .from('profiles')
      .select('onboarded_at')
      .eq('id', user.id)
      .maybeSingle()
    const profile = profRaw as { onboarded_at: string | null } | null
    needsOnboarding = !profile?.onboarded_at
  }

  if (user && user.app_metadata?.provider === 'discord' && user.user_metadata) {
    const discord_id       = user.user_metadata.provider_id ?? user.user_metadata.sub
    const discord_username = user.user_metadata.full_name ?? user.user_metadata.name ?? user.user_metadata.user_name
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
            ?? request.headers.get('x-real-ip')
            ?? '0.0.0.0'
    const ua = request.headers.get('user-agent') ?? ''

    if (discord_id) {
      try {
        const admin = supabaseAdmin()
        await admin.rpc('grant_discord_credit', {
          p_user_id:          user.id,
          p_discord_id:       String(discord_id),
          p_discord_username: String(discord_username ?? discord_id),
          p_ip:               ip,
          p_user_agent:       ua,
          p_amount_cents:     100,
        } as never)
      } catch {
        // best-effort — never block auth on credit grant
      }
    }
  }

  // Send first-time users to /onboarding (unless they explicitly requested a different next)
  const redirectTarget = needsOnboarding && next === '/dashboard' ? '/onboarding' : next
  return NextResponse.redirect(`${origin}${redirectTarget}`)
}
