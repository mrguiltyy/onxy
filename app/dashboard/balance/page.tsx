'use client'
import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Wallet, ArrowDownLeft, ArrowUpRight, AlertCircle, CheckCircle2, KeyRound, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabaseBrowser } from '@/lib/supabase/client'
import { formatPrice, relativeTime } from '@/lib/utils'
import { StripeTopupCard } from './StripeTopupCard'

interface Tx {
  id: string
  type: string
  amount_cents: number
  description: string | null
  created_at: string
}

interface Profile { balance_cents: number; parent_id: string }

export default function BalancePage() {
  const supabase = supabaseBrowser()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [history, setHistory] = useState<Tx[]>([])
  const [code, setCode]       = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profRaw }, { data: txRaw }] = await Promise.all([
      supabase.from('profiles').select('balance_cents, parent_id').eq('id', user.id).single(),
      supabase.from('transactions').select('id, type, amount_cents, description, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ])

    setProfile(profRaw as Profile | null)
    setHistory((txRaw ?? []) as Tx[])
  }, [supabase])

  useEffect(() => { refresh() }, [refresh])

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not signed in.'); setLoading(false); return }

      const trimmed = code.trim().toUpperCase()
      if (!trimmed) { setError('Enter a code.'); setLoading(false); return }

      // Look up the code via RPC-less query (RLS allows reading unused codes via service role only in production;
      // for v1 we let the user read codes if they know them — this is acceptable since codes are random)
      interface CodeRow { id: string; amount_cents: number; used_by: string | null }
      const { data: codeRowRaw } = await supabase
        .from('redeem_codes')
        .select('id, amount_cents, used_by')
        .eq('code', trimmed)
        .maybeSingle()

      const codeRow = codeRowRaw as CodeRow | null

      if (!codeRow) {
        setError('Code not found.')
        setLoading(false); return
      }
      if (codeRow.used_by) {
        setError('Code already redeemed.')
        setLoading(false); return
      }

      // Mark code used + credit balance
      await supabase
        .from('redeem_codes')
        .update({ used_by: user.id, used_at: new Date().toISOString() } as never)
        .eq('id', codeRow.id)

      const { data: currentProfRaw } = await supabase
        .from('profiles')
        .select('balance_cents')
        .eq('id', user.id)
        .single<{ balance_cents: number }>()

      const newBalance = Number(currentProfRaw?.balance_cents ?? 0) + Number(codeRow.amount_cents)
      await supabase.from('profiles').update({ balance_cents: newBalance } as never).eq('id', user.id)

      await supabase.from('transactions').insert({
        user_id:      user.id,
        type:         'topup',
        amount_cents: codeRow.amount_cents,
        description:  `Redeemed code ${trimmed}`,
      } as never)

      await supabase.from('activity').insert({
        user_id:      user.id,
        event_type:   'redeemed',
        target_label: trimmed,
      } as never)

      setSuccess(`Credited ${formatPrice(codeRow.amount_cents)} to your balance.`)
      setCode('')
      await refresh()
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setLoading(false)
    }
  }

  return (
    <div className="animate-in">
      <h1 className="text-[22px] font-bold tracking-tight mb-6">Top-up Balance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Balance card */}
        <div className="card p-5">
          <p className="label-mono mb-3">Top-up Balance</p>
          <p className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider mb-1">Current Balance</p>
          <p className="text-[28px] font-bold text-[var(--ok)] tabular-nums" style={{ letterSpacing: '-0.025em' }}>
            {formatPrice(profile?.balance_cents ?? 0)}
          </p>
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[var(--hairline)]">
            <Stat label="Parent"        value={profile?.parent_id ?? '#1'} />
            <Stat label="This Month"    value={formatPrice(history.filter(t => t.type === 'topup' && new Date(t.created_at).getMonth() === new Date().getMonth()).reduce((s, t) => s + Number(t.amount_cents), 0))} />
            <Stat label="Total Redeemed"value={formatPrice(history.filter(t => t.type === 'topup').reduce((s, t) => s + Number(t.amount_cents), 0))} />
          </div>
        </div>

        {/* Stripe card top-up */}
        <Suspense fallback={null}>
          <StripeTopupCard />
        </Suspense>

        {/* Redeem */}
        <div className="card p-5">
          <p className="label-mono mb-3">Redeem code</p>
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-md mb-3" style={{ background: 'var(--bad-bg)', border: '1px solid var(--bad-border)' }}>
              <AlertCircle size={13} className="text-[var(--bad)] mt-0.5 shrink-0" />
              <p className="text-[12px] text-[var(--fg)]">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-2.5 rounded-md mb-3" style={{ background: 'var(--ok-bg)', border: '1px solid var(--ok-border)' }}>
              <CheckCircle2 size={13} className="text-[var(--ok)] mt-0.5 shrink-0" />
              <p className="text-[12px] text-[var(--fg)]">{success}</p>
            </div>
          )}
          <form onSubmit={redeem} className="flex flex-col gap-2.5">
            <Input
              label="Top-up code"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              required
            />
            <Button type="submit" variant="primary" loading={loading} className="w-full" icon={loading ? undefined : <Wallet size={14} />}>
              {loading ? 'Redeeming...' : 'Redeem'}
            </Button>
          </form>
        </div>

        {/* Welcome / How it works */}
        <div className="card p-5">
          <p className="label-mono mb-3">Welcome</p>
          <p className="text-[13px] text-[var(--fg-dim)] leading-relaxed">
            Redeem a top-up code from your master account to credit your balance instantly.
          </p>
          <ul className="mt-3 space-y-1.5">
            <Bullet>Instant credit</Bullet>
            <Bullet>Secure redemption</Bullet>
          </ul>
        </div>

        <div className="card p-5">
          <p className="label-mono mb-3">How it works</p>
          <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed mb-2">Redeem codes from your master account.</p>
          <ul className="text-[12.5px] text-[var(--fg-dim)] space-y-1">
            <li>• Enter the code to add funds instantly.</li>
            <li>• Balance is credited immediately.</li>
            <li>• Redeem before codes expire.</li>
          </ul>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link href="/dashboard/generate" className="card card-hover p-4 flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
            <KeyRound size={15} />
          </span>
          <span className="text-[14px] font-semibold group-hover:text-[var(--brand)] transition-colors">Generate</span>
        </Link>
        <Link href="/dashboard/licenses" className="card card-hover p-4 flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
            <KeyRound size={15} />
          </span>
          <span className="text-[14px] font-semibold group-hover:text-[var(--brand)] transition-colors">Licenses</span>
        </Link>
        <Link href="/dashboard/account" className="card card-hover p-4 flex items-center gap-3 group">
          <span className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
            <User size={15} />
          </span>
          <span className="text-[14px] font-semibold group-hover:text-[var(--brand)] transition-colors">Account</span>
        </Link>
      </div>

      {/* History */}
      <div className="card">
        <div className="px-5 py-4 border-b border-[var(--hairline)]">
          <p className="label-mono">History</p>
          <h2 className="font-semibold">Code redemptions</h2>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-12 text-center text-[13px] text-[var(--fg-mute)]">
            No redemptions yet. Redeem your first code above.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>When</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {history.map(t => (
                <tr key={t.id}>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium capitalize">
                      {t.amount_cents > 0
                        ? <ArrowDownLeft size={12} className="text-[var(--ok)]" />
                        : <ArrowUpRight size={12} className="text-[var(--bad)]" />}
                      {t.type}
                    </span>
                  </td>
                  <td className="text-[13px]">{t.description ?? '—'}</td>
                  <td className="text-[12.5px]">{relativeTime(t.created_at)}</td>
                  <td className="text-right">
                    <span
                      className="font-mono font-semibold tabular-nums"
                      style={{ color: t.amount_cents > 0 ? 'var(--ok)' : 'var(--bad)' }}
                    >
                      {t.amount_cents > 0 ? '+' : ''}{formatPrice(t.amount_cents)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[var(--fg-mute)] uppercase tracking-wider">{label}</p>
      <p className="text-[13px] font-semibold text-[var(--fg)] mt-0.5 tabular-nums">{value}</p>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-[12.5px] text-[var(--fg-dim)]">
      <span className="w-1 h-1 rounded-full bg-[var(--brand)]" />
      {children}
    </li>
  )
}
