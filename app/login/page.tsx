'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Brand } from '@/components/Brand'
import { DiscordButton } from '@/components/DiscordButton'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <Form />
    </Suspense>
  )
}

function Form() {
  const router = useRouter()
  const next = useSearchParams().get('next') ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const supabase = supabaseBrowser()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }
      // Hard navigation so middleware re-evaluates and cookies are fresh
      window.location.assign(next)
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
          <h1 className="text-[22px] font-bold mb-1">Sign in</h1>
          <p className="text-[13.5px] text-[var(--fg-dim)] mb-6">Welcome back. Enter your credentials.</p>

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
            <DiscordButton label="Continue with Discord" />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
            <span className="text-[10.5px] uppercase tracking-wider text-[var(--fg-mute)]">or with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
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
              placeholder="••••••••"
              icon={<Lock size={14} />}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
            />

            <Button type="submit" variant="primary" loading={loading} className="mt-2 w-full !py-3" icon={loading ? undefined : <ArrowRight size={15} />}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[13.5px] text-[var(--fg-dim)] mt-6">
          No account?{' '}
          <Link href="/register" className="text-[var(--brand)] font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
