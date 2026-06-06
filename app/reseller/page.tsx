import Link from 'next/link'
import { ArrowRight, Check, Crown, Star, Wallet, Zap, Boxes, Code2, Sparkles } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

export const metadata = {
  title: 'Become a Reseller · OP',
  description: 'Run your own panel selling OP\'s tools — wholesale pricing, white-label branding, auth engine included.',
}
export const dynamic = 'force-dynamic'

interface Plan {
  id:                     string
  slug:                   string
  name:                   string
  tagline:                string | null
  description:            string | null
  price_lifetime_cents:   number | null
  price_monthly_cents:    number | null
  price_yearly_cents:     number | null
  features:               string[]
  max_applications:       number | null
  extra_discount_pct:     number
  priority_support:       boolean
  featured:               boolean
  badge:                  string | null
  cta_label:              string | null
  sort_order:             number
}

interface Profile { role: string; reseller_plan_id: string | null; reseller_plan_expires_at: string | null }

export default async function ResellerPage() {
  const admin = supabaseAdmin()
  const { data: plansRaw } = await admin
    .from('reseller_plans')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  const plans = (plansRaw as Plan[] | null) ?? []

  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  let profile: Profile | null = null
  if (user) {
    const { data: profRaw } = await supa.from('profiles')
      .select('role, reseller_plan_id, reseller_plan_expires_at')
      .eq('id', user.id)
      .maybeSingle()
    profile = profRaw as Profile | null
  }
  const isReseller = profile?.role === 'reseller' || profile?.role === 'super_admin'

  return (
    <PublicShell wide>
      {/* Hero */}
      <div className="text-center max-w-[720px] mx-auto mb-12">
        <p className="label-mono mb-3">Reseller program</p>
        <h1 className="text-[40px] md:text-[52px] font-bold tracking-tight leading-[1.05] mb-5" style={{ letterSpacing: '-0.03em' }}>
          Run your own panel,<br/>
          <span style={{
            background: 'var(--brand-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>using our catalog.</span>
        </h1>
        <p className="text-[15.5px] text-[var(--fg-dim)] leading-relaxed mb-8">
          Pick a plan below. Pay once or monthly. Once you&apos;re in, you can apply to white-label any product,
          embed our auth engine in your own tools, and pay wholesale on every key you generate.
        </p>

        {isReseller && (
          <div className="card p-4 inline-flex items-center gap-2 text-[13px]" style={{
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)',
          }}>
            <Check size={13} className="text-[var(--ok)]" />
            <span>You&apos;re already a reseller. <Link href="/dashboard/applications" className="text-[var(--brand)] hover:underline">Manage applications →</Link></span>
          </div>
        )}
      </div>

      {/* Value props */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-14 max-w-[960px] mx-auto">
        <Prop icon={<Boxes  size={14} />} title="White-label catalog"     body="Apply to resell any active product with your own branding." />
        <Prop icon={<Code2  size={14} />} title="Auth for your own tools" body="Drop-in SDK in 7 languages. Unlimited applications on Pro+." />
        <Prop icon={<Wallet size={14} />} title="Wholesale pricing"       body="Pay 25% (or less) of retail per key. Extra discount stacks on Pro+." />
        <Prop icon={<Zap    size={14} />} title="Update notifications"    body="The instant we ship an update to a product you resell, you know." />
      </div>

      {/* Plans grid */}
      {plans.length === 0 ? (
        <div className="card p-16 text-center max-w-[640px] mx-auto">
          <p className="text-[14px] text-[var(--fg-dim)]">No plans live right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[1080px] mx-auto">
          {plans.map(p => <PlanCard key={p.id} plan={p} signedIn={!!user} isReseller={isReseller} currentPlanId={profile?.reseller_plan_id ?? null} />)}
        </div>
      )}

      {/* FAQ */}
      <div className="max-w-[720px] mx-auto mt-20">
        <h2 className="text-[24px] font-bold tracking-tight text-center mb-2">Common questions</h2>
        <p className="text-[13.5px] text-[var(--fg-dim)] text-center mb-8">If we missed yours, open a ticket from your dashboard.</p>

        <div className="space-y-3">
          <FaqItem
            q="Can I cancel a monthly plan?"
            a="Yes, anytime. You keep reseller access until the end of your paid period — then your role flips back to a regular user. You don't lose your applications or licenses."
          />
          <FaqItem
            q="What's the difference between this and being a regular user?"
            a="Regular users can buy tools for themselves. Resellers can rebrand our tools and generate keys at wholesale to sell to their own audience, plus use our auth engine to add HWID-locked licensing to their own tools (the auth.gg-style API)."
          />
          <FaqItem
            q="Do I still pay per key after my plan?"
            a={`Yes — your plan unlocks the ability to resell. You still pay wholesale per key you generate. Wholesale is typically 25% of retail. Pro and Elite stack additional discount on top of that.`}
          />
          <FaqItem
            q="Can I upgrade from Starter to Pro / Elite?"
            a="Yes — and you only pay the difference. Your unused time on your current plan converts to credit toward the upgrade."
          />
          <FaqItem
            q="What if I want to resell something not in your catalog?"
            a="You can use our auth engine to license YOUR own tools — that's the /dashboard/applications side. Combine both: sell our tools AND yours, all under one panel."
          />
        </div>
      </div>
    </PublicShell>
  )
}

function PlanCard({ plan, signedIn, isReseller, currentPlanId }: { plan: Plan; signedIn: boolean; isReseller: boolean; currentPlanId: string | null }) {
  const isCurrent = currentPlanId === plan.id
  const cheapest = plan.price_monthly_cents ?? plan.price_yearly_cents ?? plan.price_lifetime_cents
  const cheapestLabel = plan.price_monthly_cents != null ? '/mo' : plan.price_yearly_cents != null ? '/yr' : ' once'

  return (
    <div
      className={`card relative overflow-hidden ${plan.featured ? 'ring-1' : ''}`}
      style={{
        ...(plan.featured ? { boxShadow: '0 0 0 1px rgba(240,164,183,0.4), 0 24px 48px rgba(240,164,183,0.10)' } : {}),
      }}
    >
      {plan.badge && (
        <div className="absolute top-0 inset-x-0 py-1.5 text-center text-[10.5px] font-bold uppercase tracking-wider"
          style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
          <Star size={9} className="inline mr-1" /> {plan.badge}
        </div>
      )}

      <div className={`p-7 ${plan.badge ? 'pt-12' : ''}`}>
        <h3 className="text-[20px] font-bold tracking-tight flex items-center gap-2">
          {plan.slug === 'elite' && <Crown size={18} className="text-[var(--brand)]" />}
          {plan.name}
        </h3>
        {plan.tagline && <p className="text-[12.5px] text-[var(--fg-dim)] mt-1">{plan.tagline}</p>}

        {/* Pricing block */}
        <div className="my-6">
          {cheapest != null && (
            <>
              <p className="text-[36px] font-bold tabular-nums leading-none" style={{ letterSpacing: '-0.025em' }}>
                {formatPrice(cheapest)}
                <span className="text-[14px] font-medium text-[var(--fg-mute)] ml-1">{cheapestLabel}</span>
              </p>
              {plan.price_lifetime_cents && plan.price_monthly_cents && (
                <p className="text-[11.5px] text-[var(--fg-mute)] mt-2">
                  or <strong className="text-[var(--fg-dim)]">{formatPrice(plan.price_lifetime_cents)}</strong> lifetime
                </p>
              )}
              {plan.price_yearly_cents && plan.price_monthly_cents && (
                <p className="text-[11.5px] text-[var(--fg-mute)] mt-1">
                  or <strong className="text-[var(--fg-dim)]">{formatPrice(plan.price_yearly_cents)}</strong> /yr
                  <span className="ml-1 text-[var(--ok)]">save ~17%</span>
                </p>
              )}
            </>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-[var(--fg-dim)]">
              <span className="w-4 h-4 rounded flex items-center justify-center mt-0.5 shrink-0"
                style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
                <Check size={9} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isCurrent ? (
          <div className="px-4 py-2.5 rounded-md text-center text-[12.5px] font-semibold"
            style={{ background: 'rgba(34,197,94,0.08)', color: 'var(--ok)', border: '1px solid rgba(34,197,94,0.25)' }}>
            Your current plan
          </div>
        ) : (
          <Link
            href={signedIn ? `/reseller/checkout?plan=${plan.slug}` : `/register?intent=reseller&plan=${plan.slug}`}
            className={`btn w-full ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}
          >
            {plan.cta_label ?? 'Become a reseller'} <ArrowRight size={13} />
          </Link>
        )}
        {!isCurrent && !signedIn && (
          <p className="text-[10.5px] text-[var(--fg-mute)] text-center mt-2">Free account first · no card required</p>
        )}
      </div>
    </div>
  )
}

function Prop({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-4">
      <span className="w-7 h-7 rounded-md flex items-center justify-center mb-2"
        style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>{icon}</span>
      <p className="font-semibold text-[13px] mb-1">{title}</p>
      <p className="text-[11.5px] text-[var(--fg-dim)] leading-relaxed">{body}</p>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="card p-5 group">
      <summary className="cursor-pointer flex items-center justify-between font-semibold text-[14px]">
        {q}
        <span className="text-[var(--brand)] transition-transform group-open:rotate-45">＋</span>
      </summary>
      <p className="text-[13px] text-[var(--fg-dim)] leading-relaxed mt-3 whitespace-pre-wrap">{a}</p>
    </details>
  )
}
