'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Mail, ArrowRight, ChevronLeft } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const { toast } = useToast()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    })

    setLoading(false)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'error' })
      return
    }

    setSent(true)
    toast({ title: 'Reset email sent', variant: 'success' })
  }

  return (
    <div className="w-full max-w-[420px]">
      <Link href="/login" className="inline-flex items-center gap-1 text-[var(--fg-mute)] hover:text-[var(--fg)] text-sm mb-8 transition-colors">
        <ChevronLeft size={14} /> Back to sign in
      </Link>

      <div className="mb-8">
        <h1 className="text-white font-bold text-3xl tracking-tight mb-2" style={{ letterSpacing: '-0.025em' }}>
          Reset password
        </h1>
        <p className="text-[var(--fg-dim)] text-[14.5px]">
          Enter the email on your Onyx account. We&apos;ll send you a link.
        </p>
      </div>

      {sent ? (
        <div className="p-5 rounded-md border" style={{ borderColor: 'var(--c-dim)', background: 'var(--c-faint)' }}>
          <p className="text-[var(--c)] font-semibold mb-1">Check your inbox</p>
          <p className="text-[var(--fg-dim)] text-[13.5px] leading-relaxed">
            If an account exists for <strong className="text-[var(--fg)]">{email}</strong>, a reset link is on the way.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={<Mail size={14} />}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Button type="submit" variant="primary" loading={loading} className="w-full !py-3 mt-3" iconRight={<ArrowRight size={15} />}>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="text-center text-[13.5px] text-[var(--fg-dim)] mt-8">
        Remembered it? {' '}
        <Link href="/login" className="text-[var(--c)] font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
