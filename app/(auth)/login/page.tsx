'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { useToast } from '@/components/ui/Toast'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[420px]" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? '/dashboard'

  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [form, setForm]       = useState({ email: '', password: '', remember: true })
  const { toast } = useToast()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)

    const supabase = supabaseBrowser()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    form.email,
      password: form.password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      toast({ title: 'Sign in failed', description: authError.message, variant: 'error' })
      return
    }

    toast({ title: 'Welcome back', variant: 'success' })
    router.push(next)
    router.refresh()
  }

  const discordLogin = async () => {
    const supabase = supabaseBrowser()
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options:  { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-8">
        <h1 className="text-white font-bold text-3xl tracking-tight mb-2" style={{ letterSpacing: '-0.025em' }}>
          Sign in
        </h1>
        <p className="text-[var(--fg-dim)] text-[14.5px]">
          Welcome back. Enter your credentials to continue.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3.5 mb-5 rounded-md border border-[rgba(255,91,117,0.25)] bg-[rgba(255,91,117,0.06)]">
          <AlertCircle size={14} className="text-[var(--bad)] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[var(--fg-dim)]">{error}</p>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4 mb-6">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail size={14} />}
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type={show ? 'text' : 'password'}
          placeholder="••••••••"
          icon={<Lock size={14} />}
          suffix={
            <button type="button" onClick={() => setShow(s => !s)}
              className="cursor-pointer text-[var(--fg-mute)] hover:text-white transition-colors flex"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          }
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between mt-1">
          <Checkbox
            label={<span className="text-[13px]">Remember me</span>}
            checked={form.remember}
            onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
          />
          <Link href="/forgot-password" className="text-[12.5px] text-[var(--c)] hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="w-full !py-3 mt-3"
          iconRight={<ArrowRight size={15} />}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[var(--hairline)]" />
        <span className="text-xs text-[var(--fg-mute)]">or</span>
        <div className="flex-1 h-px bg-[var(--hairline)]" />
      </div>

      <button
        type="button"
        onClick={discordLogin}
        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-md font-semibold text-[14px] text-white transition-all duration-150 hover:brightness-110"
        style={{ background: '#5865F2', boxShadow: '0 4px 14px rgba(88,101,242,0.25)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
        </svg>
        Continue with Discord
      </button>

      <p className="text-center text-[13.5px] text-[var(--fg-dim)] mt-8">
        New to Onyx? {' '}
        <Link href="/register" className="text-[var(--c)] font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
