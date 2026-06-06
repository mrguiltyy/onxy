'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Brand } from '@/components/Brand'
import { DiscordButton } from '@/components/DiscordButton'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function RegisterPage() {
  return (
    <Suspense fallback={<div />}>
      <Form />
    </Suspense>
  )
}

function Form() {
  const next = useSearchParams().get('next') ?? '/dashboard'

  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const supabase = supabaseBrowser()
      // Use the public app URL when available (matches Supabase Site URL),
      // fall back to whatever the browser is hosted at.
      const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${appOrigin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: { username },
        },
      })
      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }
      // If email confirmations are off, user is logged in immediately
      if (data.session) {
        window.location.assign(next)
        return
      }
      setDone(true)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">

        {/* Brand */}
        <div className="flex justify-center mb-10">
          <Brand size="xl" tagline />
        </div>

        <div className="card p-7">
          {done ? (
            <div className="text-center">
              <CheckCircle2 size={32} className="text-[var(--ok)] mx-auto mb-3" />
              <h1 className="text-[20px] font-bold mb-2">Check your email</h1>
              <p className="text-[13.5px] text-[var(--fg-dim)] mb-6">
                We sent a confirmation link to <span className="text-[var(--fg)] font-medium">{email}</span>.
                Click it to finish signing up.
              </p>
              <Link href="/login" className="text-[var(--brand)] text-[13px] hover:underline">Back to sign in</Link>
            </div>
          ) : (
            <>
              <h1 className="text-[22px] font-bold mb-1">Create account</h1>
              <p className="text-[13.5px] text-[var(--fg-dim)] mb-6">Get instant access to the panel.</p>

              {error && (
                <div
                  className="flex items-start gap-2.5 p-3 rounded-md mb-5"
                  style={{ background: 'var(--bad-bg)', border: '1px solid var(--bad-border)' }}
                >
                  <AlertCircle size={14} className="text-[var(--bad)] mt-0.5 shrink-0" />
                  <p className="text-[13px] text-[var(--fg)]">{error}</p>
                </div>
              )}

              {/* OAuth */}
              <div className="mb-5">
                <DiscordButton label="Sign up with Discord" />
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
                <span className="text-[10.5px] uppercase tracking-wider text-[var(--fg-mute)]">or with email</span>
                <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
              </div>

              <form onSubmit={submit} className="flex flex-col gap-4">
                <Input
                  label="Username"
                  type="text"
                  placeholder="yourhandle"
                  icon={<User size={14} />}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={32}
                  autoComplete="username"
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  icon={<Mail size={14} />}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 6 characters"
                  icon={<Lock size={14} />}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />

                <Button type="submit" variant="primary" loading={loading} className="mt-2 w-full !py-3" icon={loading ? undefined : <ArrowRight size={15} />}>
                  {loading ? 'Creating...' : 'Create account'}
                </Button>
              </form>
            </>
          )}
        </div>

        {!done && (
          <p className="text-center text-[13.5px] text-[var(--fg-dim)] mt-6">
            Already registered?{' '}
            <Link href="/login" className="text-[var(--brand)] font-semibold hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}
