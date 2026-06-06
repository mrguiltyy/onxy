import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Wallet, Check, ArrowRight } from 'lucide-react'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { CheckoutForm } from './CheckoutForm'

export const metadata = { title: 'Checkout · Reseller' }
export const dynamic = 'force-dynamic'

interface Plan {
  id:                   string
  slug:                 string
  name:                 string
  tagline:              string | null
  features:             string[]
  price_lifetime_cents: number | null
  price_monthly_cents:  number | null
  price_yearly_cents:   number | null
  badge:                string | null
}

interface Profile { role: string; balance_cents: number; reseller_plan_id: string | null }

export default async function ResellerCheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const params = await searchParams
  const slug = params.plan
  if (!slug) redirect('/reseller')

  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect(`/login?redirect=/reseller/checkout?plan=${slug}`)

  const admin = supabaseAdmin()
  const { data: pRaw } = await admin
    .from('reseller_plans').select('*').eq('slug', slug).eq('active', true).maybeSingle()
  const plan = pRaw as Plan | null
  if (!plan) notFound()

  const { data: profRaw } = await supa
    .from('profiles').select('role, balance_cents, reseller_plan_id').eq('id', user.id).maybeSingle()
  const profile = profRaw as Profile | null
  const balance = profile?.balance_cents ?? 0

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b" style={{
        background: 'rgba(10,13,20,0.85)', borderColor: 'var(--hairline)', backdropFilter: 'blur(14px) saturate(180%)',
      }}>
        <div className="container-x flex items-center justify-between py-3">
          <Link href="/reseller" className="text-[12.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1">
            <ChevronLeft size={13} /> Back to plans
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="container-x max-w-[920px]">
          <div className="mb-10">
            <p className="label-mono mb-2">Checkout</p>
            <h1 className="text-[32px] font-bold tracking-tight" style={{ letterSpacing: '-0.025em' }}>
              Activate your reseller plan
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Left: checkout form */}
            <div className="card p-7">
              <CheckoutForm plan={plan} balance={balance} userId={user.id} />
            </div>

            {/* Right: order summary */}
            <div className="card p-6 lg:sticky lg:top-24">
              {plan.badge && (
                <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded inline-flex items-center gap-1 mb-3"
                  style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
                  ★ {plan.badge}
                </div>
              )}
              <h2 className="font-bold text-[18px] tracking-tight mb-1">{plan.name}</h2>
              {plan.tagline && <p className="text-[12px] text-[var(--fg-dim)] mb-4">{plan.tagline}</p>}

              <div className="border-t pt-4" style={{ borderColor: 'var(--hairline)' }}>
                <p className="label-mono mb-3">Includes</p>
                <ul className="space-y-1.5">
                  {plan.features.slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11.5px] text-[var(--fg-dim)]">
                      <Check size={10} className="text-[var(--ok)] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--hairline)' }}>
                <div className="flex items-center justify-between text-[12px] mb-2">
                  <span className="text-[var(--fg-mute)]">Wallet balance</span>
                  <span className="font-mono tabular-nums">{formatPrice(balance)}</span>
                </div>
                <Link href="/dashboard/balance" className="text-[11.5px] text-[var(--brand)] hover:underline inline-flex items-center gap-1">
                  Top up wallet <Wallet size={10} /> <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
