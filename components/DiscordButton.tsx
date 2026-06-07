'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'

/**
 * Sign in / link with Discord.
 *
 * Requires Discord OAuth enabled in Supabase Dashboard:
 *   Authentication → Providers → Discord → enabled
 *   Client ID + Client Secret from https://discord.com/developers
 *
 * On successful link, the callback grants $1 wallet credit (once per user, once per Discord ID).
 */
export function DiscordButton({ label = 'Continue with Discord', credit = true }: { label?: string; credit?: boolean }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go() {
    setError(null)
    setPending(true)
    try {
      const supabase = supabaseBrowser()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'identify email',
        },
      })
      if (error) { setError(error.message); setPending(false) }
      // On success, Supabase redirects — no need to handle here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={go}
        disabled={pending}
        className="btn w-full transition-colors"
        style={{
          background: '#5865f2',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 12px rgba(88,101,242,0.30)',
        }}
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <svg width="15" height="15" viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.3043 16.3068 45.2085C16.679 44.9298 17.0513 44.6398 17.4067 44.347C17.471 44.2935 17.5605 44.2822 17.6362 44.316C29.2558 49.6182 41.8354 49.6182 53.3179 44.316C53.3936 44.2794 53.4831 44.2907 53.5502 44.3442C53.9057 44.637 54.2779 44.9298 54.6529 45.2085C54.7816 45.3043 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
          </svg>
        )}
        <span>{label}</span>
      </button>
      {credit && (
        <p className="text-[10.5px] text-[var(--fg-mute)] text-center">
          Earn <strong className="text-[var(--ok)]">$1.00 wallet credit</strong> on first link
        </p>
      )}
      {error && <p className="text-[11.5px] text-[var(--bad)] text-center">{error}</p>}
    </div>
  )
}
