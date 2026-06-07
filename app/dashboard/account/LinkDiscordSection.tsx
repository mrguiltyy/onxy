'use client'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'

interface Props {
  linked:      boolean
  username:    string | null
  creditGiven: boolean
}

export function LinkDiscordSection({ linked, username, creditGiven }: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function linkDiscord() {
    setError(null)
    setPending(true)
    try {
      const supabase = supabaseBrowser()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/account`,
          scopes: 'identify email',
        },
      })
      if (error) { setError(error.message); setPending(false) }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setPending(false)
    }
  }

  return (
    <div className="card p-5 mb-5">
      <div className="flex items-start gap-4">
        <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'rgba(88,101,242,0.15)' }}>
          <svg width="18" height="18" viewBox="0 0 71 55" fill="#5865f2">
            <path d="M60.1 4.9C55.6 2.8 50.7 1.3 45.7 0.4c-.7 1.1-1.4 2.6-1.9 3.7-5.5-.8-10.9-.8-16.3 0-.5-1.1-1.2-2.6-1.9-3.7C20.3 1.3 15.4 2.8 10.9 4.9 1.6 18.7-1 32.1.3 45.4c6.1 4.5 12 7.2 17.8 9 1.4-1.9 2.6-3.9 3.6-5.9-2-.7-3.8-1.6-5.6-2.7.5-.3.9-.6 1.3-.9 11.6 5.3 24.2 5.3 35.7 0 .4.3.8.6 1.3.9-1.8 1-3.6 2-5.6 2.7 1.1 2 2.3 3.9 3.6 5.9 5.8-1.8 11.7-4.5 17.8-9 1.5-15.3-2.5-28.6-10.5-40.5zM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.2 6.4 7.2c0 4-2.8 7.2-6.4 7.2zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2 6.5 3.2 6.4 7.2c0 4-2.8 7.2-6.4 7.2z"/>
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="label-mono mb-1">Integrations</p>
          <h2 className="text-[15px] font-bold mb-1">Discord</h2>

          {linked ? (
            <>
              <p className="text-[12.5px] text-[var(--fg-dim)] mb-2 leading-relaxed">
                Linked to <strong className="text-[var(--fg)] font-mono">{username ?? 'your account'}</strong>.
                You&apos;ll receive ticket replies and product updates in Discord (when enabled).
              </p>
              {creditGiven && (
                <p className="text-[11.5px] inline-flex items-center gap-1.5 text-[var(--ok)] mt-1">
                  <Check size={11} /> $1.00 wallet credit was applied
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-[12.5px] text-[var(--fg-dim)] mb-3 leading-relaxed">
                Link your Discord account to earn <strong className="text-[var(--ok)]">$1.00 wallet credit</strong> (one-time, first link only).
                We&apos;ll also use it for support and notifications.
              </p>
              <button onClick={linkDiscord} disabled={pending} className="btn btn-sm"
                style={{ background: '#5865f2', color: '#fff', border: '1px solid rgba(255,255,255,0.10)' }}>
                {pending ? <Loader2 size={12} className="animate-spin" /> : 'Link Discord & claim $1'}
              </button>
              {error && <p className="text-[11.5px] text-[var(--bad)] mt-2">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
