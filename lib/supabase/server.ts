import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

/**
 * Server Supabase client (anon key + user session).
 * Use in server components, server actions, and route handlers
 * to access data scoped to the current user.
 */
export async function supabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies can't be set here.
            // Middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  )
}

/**
 * Service-role Supabase client — bypasses RLS.
 * ONLY for trusted server contexts (admin operations, webhooks, cron).
 * Never expose to the browser.
 */
let _admin: ReturnType<typeof createClient> | null = null

export function supabaseAdmin() {
  if (_admin) return _admin
  _admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  return _admin
}
