import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Session refresh middleware.
 * Runs on every request, keeps the auth cookie fresh, and
 * redirects unauthenticated users away from /dashboard and /admin.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session and gets the current user
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // ── Unauthenticated protection ────────────────────────────────
  const isProtected = path.startsWith('/dashboard') || path.startsWith('/admin')

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // ── Docs gating — admins / support / resellers only ──────────
  if (path.startsWith('/docs') && !path.startsWith('/api')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile as { role: string } | null)?.role
    const docsRoles = ['super_admin', 'support', 'reseller']

    if (!role || !docsRoles.includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Already-authenticated users hitting /login or /register go to dashboard
  const isAuthPage = path === '/login' || path === '/register'
  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
