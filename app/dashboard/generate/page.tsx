'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabaseBrowser } from '@/lib/supabase/client'
import { generateLicenseKey, formatPrice } from '@/lib/utils'

const PRODUCTS = [
  { slug: 'temp-spoofer',    name: 'Temp Spoofer'    },
  { slug: 'onyx-rage',       name: 'Onyx Rage'       },
  { slug: 'onyx-stealth',    name: 'Onyx Stealth'    },
  { slug: 'onyx-core',       name: 'Onyx Core'       },
]

const DURATIONS = [
  { days: 1,   label: '1 Day',     centsPer:    1 },
  { days: 7,   label: '7 Days',    centsPer:    7 },
  { days: 30,  label: '30 Days',   centsPer:   30 },
  { days: 600, label: '600 Days',  centsPer:  600 },
]

export default function GeneratePage() {
  const router = useRouter()
  const [product,  setProduct]  = useState(PRODUCTS[0].slug)
  const [duration, setDuration] = useState(DURATIONS[0].days)
  const [count,    setCount]    = useState(1)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState<{ count: number; cost: number } | null>(null)

  const productLabel = PRODUCTS.find(p => p.slug === product)?.name ?? product
  const durConfig    = DURATIONS.find(d => d.days === duration) ?? DURATIONS[0]
  const totalCost    = durConfig.centsPer * count

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)

    try {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not signed in.'); setLoading(false); return }

      // Check balance
      const { data: prof } = await supabase
        .from('profiles')
        .select('balance_cents')
        .eq('id', user.id)
        .single<{ balance_cents: number }>()

      const balance = Number(prof?.balance_cents ?? 0)
      if (balance < totalCost) {
        setError(`Insufficient balance. You have ${formatPrice(balance)}, need ${formatPrice(totalCost)}.`)
        setLoading(false)
        return
      }

      // Generate keys
      const newKeys = Array.from({ length: count }, () => {
        const { full, prefix } = generateLicenseKey()
        return {
          user_id:       user.id,
          product:       productLabel,
          key_full:      full,
          key_prefix:    prefix,
          status:        'pending',
          duration_days: duration,
        }
      })

      const { error: insertErr } = await supabase.from('licenses').insert(newKeys as never)
      if (insertErr) { setError(insertErr.message); setLoading(false); return }

      // Deduct balance + record transaction + activity
      const newBalance = balance - totalCost
      await supabase.from('profiles').update({ balance_cents: newBalance } as never).eq('id', user.id)

      await supabase.from('transactions').insert({
        user_id:      user.id,
        type:         'generate',
        amount_cents: -totalCost,
        description:  `Generated ${count} key${count > 1 ? 's' : ''} for ${productLabel} (${durConfig.label})`,
      } as never)

      await supabase.from('activity').insert({
        user_id:      user.id,
        event_type:   'generated',
        target_label: `${productLabel} × ${count}`,
      } as never)

      setDone({ count, cost: totalCost })
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="animate-in max-w-[480px] mx-auto">
        <div className="card p-8 text-center">
          <CheckCircle2 size={36} className="text-[var(--ok)] mx-auto mb-3" />
          <h1 className="text-[20px] font-bold mb-2">{done.count} key{done.count > 1 ? 's' : ''} generated</h1>
          <p className="text-[13.5px] text-[var(--fg-dim)] mb-1">Cost: <strong className="text-[var(--fg)]">{formatPrice(done.cost)}</strong></p>
          <p className="text-[12.5px] text-[var(--fg-mute)] mb-6">Find them in your Licenses page.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="primary" onClick={() => router.push('/dashboard/licenses')}>View licenses</Button>
            <Button variant="outline" onClick={() => setDone(null)}>Generate more</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in max-w-[640px]">
      <div className="mb-6">
        <p className="label-mono mb-1">Generate keys</p>
        <h1 className="text-[26px] font-bold tracking-tight">Create License</h1>
      </div>

      <div className="card p-6">
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

          {/* Product */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-[var(--fg-dim)] font-medium">Product</label>
            <select
              className="input"
              value={product}
              onChange={e => setProduct(e.target.value)}
            >
              {PRODUCTS.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </div>

          {/* Count */}
          <Input
            label="Number of keys"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={e => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
          />

          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-[var(--fg-dim)] font-medium">Duration</label>
            <select
              className="input"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
            >
              {DURATIONS.map(d => (
                <option key={d.days} value={d.days}>
                  {d.label} — {formatPrice(d.centsPer)}
                </option>
              ))}
            </select>
          </div>

          {/* Cost summary */}
          <div className="rounded-md p-4 mt-2 flex flex-col gap-1.5" style={{ background: 'var(--bg-2)', border: '1px solid var(--hairline)' }}>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[var(--fg-dim)]">Cost</span>
              <span className="text-[var(--fg)] font-mono">
                {formatPrice(durConfig.centsPer)} × {count}
              </span>
            </div>
            <div className="flex items-center justify-between text-[15px] pt-2 border-t border-[var(--hairline)]">
              <span className="font-semibold">Total</span>
              <span className="text-[var(--brand)] font-bold tabular-nums">{formatPrice(totalCost)}</span>
            </div>
          </div>

          <Button type="submit" variant="primary" loading={loading} icon={loading ? undefined : <KeyRound size={15} />} className="mt-2 w-full !py-3">
            {loading
              ? 'Generating...'
              : `Generate ${count} ${count > 1 ? 'keys' : 'key'} for ${productLabel} — ${formatPrice(totalCost)}`}
          </Button>
        </form>
      </div>
    </div>
  )
}
