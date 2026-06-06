'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
