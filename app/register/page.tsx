'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
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

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 0 0 1px rgba(59,130,246,0.3), 0 6px 20px rgba(59,130,246,0.3)',
            }}
          >
            O
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold leading-none">Onyx</span>
            <span className="text-[10px] text-[var(--fg-mute)] tracking-wider uppercase mt-1">Panel</span>
          </div>
        </Link>

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
