import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Anon key only — RLS policies enforce all access control.
 *
 * Usage in client components:
 *   const supabase = supabaseBrowser()
 *   const { data, error } = await supabase.from('products').select()
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
