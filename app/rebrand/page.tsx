import Link from 'next/link'
import { ArrowRight, Check, Crown, Globe, Users, Palette, ShieldCheck, Zap } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

export const metadata = {
  title:       'Rebrand — Run your own OP panel · OP',
  description: 'Buy a white-label panel on a subdomain (or custom domain). Your own users, your own products, your own admin — running on our infrastructure.',
}
export const dynamic = 'force-dynamic'

interface Plan {
  id:                    string
  slug:                  string
  name:                  string
  tagline:               string | null
  description:           string | null
  price_monthly_cents:   number | null
  price_yearly_cents:    number | null
  price_setup_cents:     number
  max_users:             number | null
  max_products:          number | null
  features:              string[]
  custom_domain_allowed: boolean
  removed_branding:      boolean
  api_access:            boolean
  featured:              boolean
  badge:                 string | null
  cta_label:             string | null
}

export default async function RebrandPage() {
  let plans: Plan[] = []
  try {
    const admin = supabaseAdmin()
    const { data } = await admin
      .from('rebrand_plans')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    plans = (data as Plan[] | null) ?? []
  } catch { /* table doesn't exist yet */ }

  return (
    <PublicShell wide>
      <div className="text-center max-w-[760px] mx-auto mb-14">
        <p className="label-mono mb-3">Rebrand program</p>
        <h1 className="text-[42px] md:text-[56px] font-bold tracking-tight leading-[1.05] mb-5" style={{ letterSpacing: '-0.03em' }}>
          Run your own panel.<br/>
          <span style={{
            background: 'var(--brand-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Your brand, your rules.</span>
        </h1>
        <p className="text-[15.5px] text-[var(--fg-dim)] leading-relaxed">
          The rebrand tier gives you a complete mini-OP — your own subdomain (or custom domain), your own users, your own products, your own admin panel. You run it like a SaaS, we run the infrastructure.
        </p>
      </div>

      {/* Value props */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-16 max-w-[1000px] mx-auto">
        <Prop icon={<Globe size={14} />}     title="Your domain"        body="Subdomain on day one. Custom domain on Pro+." />
        <Prop icon={<Palette size={14} />}   title="Your branding"      body="Logo, colors, favicon, footer copy." />
        <Prop icon={<Users size={14} />}     title="Your users"         body="They sign up to YOUR site, not ours." />
        <Prop icon={<Zap size={14} />}       title="Our infrastructure" body="HWID engine, billing, auth, status — all included." />
      </div>

      {/* Plans */}
      {plans.length === 0 ? (
        <div className="card p-16 text-center max-w-[640px] mx-auto">
          <p className="text-[14px] text-[var(--fg-dim)]">Rebrand plans are being finalized. Get in touch via Discord or open a ticket if you&apos;re interested.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[1080px] mx-auto">
          {plans.map(p => <PlanCard key={p.id} plan={p} />)}
        </div>
      )}

      {/* How it works */}
      <div className="mt-20 max-w-[1000px] mx-auto">
        <h2 className="text-[24px] md:text-[28px] font-bold tracking-tight text-center mb-2" style={{ letterSpacing: '-0.025em' }}>How a rebrand works</h2>
        <p className="text-[13.5px] text-[var(--fg-dim)] text-center mb-10 max-w-[640px] mx-auto">
          Less than a day from purchase to launch. We handle setup; you handle vision.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HowStep n="01" title="Buy + claim your slug"  body="Pick the plan. Pick your subdomain. We provision the panel within hours." />
          <HowStep n="02" title="Customize"             body="Upload your logo. Set brand colors. Write your tagline. Add your products." />
          <HowStep n="03" title="Launch"                body="Announce on Discord/Telegram/wherever. Users sign up on your domain. We process payments behind the scenes." />
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-[760px] mx-auto">
        <h2 className="text-[24px] font-bold tracking-tight text-center mb-8" style={{ letterSpacing: '-0.025em' }}>Common questions</h2>
        <div className="space-y-3">
          <Q q="What's the difference between Reseller and Rebrand?"
             a="Reseller = you sell OUR catalog with your branding, but customers buy on onxy.cc. Rebrand = you run YOUR OWN panel on YOUR OWN domain with YOUR OWN users. Rebrand is a full platform-as-a-service tenant." />
          <Q q="Where does payment go?"
             a="You set your own pricing. Customers pay you via Stripe/crypto on your panel. We take a small percentage on Starter, none on Pro/Elite (you keep 100% of revenue after Stripe fees)." />
          <Q q="Can I add my own tools?"
             a="Absolutely. You can sell our catalog at wholesale + your own tools using our auth engine. Mix and match." />
          <Q q="What about support?"
             a="Your users open tickets with you. You open tickets with us. We're never in your customer's face." />
          <Q q="Can I cancel?"
             a="Monthly plans cancel any time at end of billing period. Yearly: pro-rated refund minus setup fee. Elite is lifetime — paid once, runs forever." />
          <Q q="Setup fee?"
             a="Starter: $0. Pro: $99 (one-time, includes domain setup help). Elite: $199 (one-time, includes hands-on launch help)." />
        </div>
      </div>
    </PublicShell>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  const monthly = plan.price_monthly_cents
  const yearly  = plan.price_yearly_cents
  return (
    <div
      className="card p-7 relative overflow-hidden flex flex-col"
      style={plan.featured ? { boxShadow: '0 0 0 1px rgba(240,164,183,0.40), 0 24px 48px rgba(240,164,183,0.10)' } : undefined}
    >
      {plan.badge && (
        <div className="absolute top-0 inset-x-0 py-1.5 text-center text-[10.5px] font-bold uppercase tracking-wider"
          style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
          ★ {plan.badge}
        </div>
      )}

      <div className={`${plan.badge ? 'mt-6' : ''}`}>
        <h3 className="text-[20px] font-bold tracking-tight flex items-center gap-2">
          {plan.slug === 'elite-rebrand' && <Crown size={18} className="text-[var(--brand)]" />}
          {plan.name}
        </h3>
        {plan.tagline && <p className="text-[12.5px] text-[var(--fg-dim)] mt-1">{plan.tagline}</p>}
      </div>

      <div className="my-6">
        {monthly != null && (
          <p className="text-[36px] font-bold tabular-nums leading-none" style={{ letterSpacing: '-0.025em' }}>
            {formatPrice(monthly)}
            <span className="text-[14px] font-medium text-[var(--fg-mute)] ml-1">/mo</span>
          </p>
        )}
        {yearly != null && monthly != null && (
          <p className="text-[11.5px] text-[var(--fg-mute)] mt-2">
            or <strong className="text-[var(--fg-dim)]">{formatPrice(yearly)}</strong> /yr
            <span className="ml-1 text-[var(--ok)]">save ~17%</span>
          </p>
        )}
        {plan.price_setup_cents > 0 && (
          <p className="text-[11.5px] text-[var(--fg-mute)] mt-1">
            + <strong className="text-[var(--fg-dim)]">{formatPrice(plan.price_setup_cents)}</strong> one-time setup
          </p>
        )}
      </div>

      <ul className="space-y-2 mb-7 flex-1">
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

      <Link href="/dashboard/tickets/new?category=billing"
        className={`btn ${plan.featured ? 'btn-primary' : 'btn-secondary'} w-full mt-auto`}>
        {plan.cta_label ?? 'Get started'} <ArrowRight size={13} />
      </Link>
      <p className="text-[10.5px] text-[var(--fg-mute)] text-center mt-2">
        Talk to us via ticket — setup within 24 hours
      </p>
    </div>
  )
}

function Prop({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-4">
      <span className="w-7 h-7 rounded-md flex items-center justify-center mb-2"
        style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>{icon}</span>
      <p className="font-semibold text-[13.5px] mb-1">{title}</p>
      <p className="text-[11.5px] text-[var(--fg-dim)] leading-relaxed">{body}</p>
    </div>
  )
}

function HowStep({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card p-6">
      <p className="label-mono mb-3">{n}</p>
      <h3 className="font-semibold text-[16px] mb-2 tracking-tight">{title}</h3>
      <p className="text-[13px] text-[var(--fg-dim)] leading-relaxed">{body}</p>
    </div>
  )
}

function Q({ q, a }: { q: string; a: string }) {
  return (
    <details className="card p-5 group">
      <summary className="cursor-pointer flex items-center justify-between gap-3 font-semibold text-[14px]">
        <span>{q}</span>
        <span className="text-[var(--brand)] text-[18px] transition-transform group-open:rotate-45 shrink-0">＋</span>
      </summary>
      <p className="text-[13px] text-[var(--fg-dim)] mt-3 leading-relaxed">{a}</p>
    </details>
  )
}
