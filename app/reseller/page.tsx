import Link from 'next/link'
import { ArrowRight, Check, Boxes, Sparkles, ShieldCheck, Zap } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { ResellerCheckout } from './ResellerCheckout'

export const metadata = {
  title: 'Become a Reseller — OP',
  description: 'Pick the tools you want to resell. $15 base + $5 per extra tool. Wholesale pricing, white-label, update notifications included.',
}
export const dynamic = 'force-dynamic'

interface Product {
  id:                     string
  slug:                   string
  name:                   string
  tagline:                string | null
  image_url:              string | null
  price_lifetime:         number | null
  reseller_price_lifetime: number | null
  reseller_open:          boolean
}

interface Config {
  base_price_cents:        number
  per_tool_extra_cents:    number
  tools_included_base:     number
  yearly_discount_pct:     number
  lifetime_multiplier:     number
}

interface Profile { role: string; balance_cents: number }

export default async function ResellerPage() {
  const admin = supabaseAdmin()

  // Config
  let config: Config = { base_price_cents: 1500, per_tool_extra_cents: 500, tools_included_base: 1, yearly_discount_pct: 17, lifetime_multiplier: 7.5 }
  try {
    const { data } = await admin.from('reseller_config').select('*').eq('id', 1).maybeSingle()
    if (data) config = data as Config
  } catch {}

  // Active products that are reseller-open
  const { data: prodsRaw } = await admin
    .from('products')
    .select('id, slug, name, tagline, image_url, price_lifetime, reseller_price_lifetime, reseller_open')
    .eq('status', 'active')
    .eq('reseller_open', true)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
  const products = (prodsRaw as Product[] | null) ?? []

  // Current user state
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  let profile: Profile | null = null
  if (user) {
    const { data: profRaw } = await supa.from('profiles')
      .select('role, balance_cents').eq('id', user.id).maybeSingle()
    profile = profRaw as Profile | null
  }
  const isReseller = profile?.role === 'reseller' || profile?.role === 'super_admin'

  return (
    <PublicShell wide>
      <div className="text-center max-w-[760px] mx-auto mb-12">
        <p className="label-mono mb-3">Reseller program</p>
        <h1 className="text-[40px] md:text-[54px] font-bold tracking-tight leading-[1.05] mb-5" style={{ letterSpacing: '-0.03em' }}>
          Pick your tools.<br/>
          <span style={{
            background: 'var(--brand-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Set your prices. Keep the spread.</span>
        </h1>
        <p className="text-[15.5px] text-[var(--fg-dim)] leading-relaxed">
          <strong className="text-[var(--fg)]">{formatPrice(config.base_price_cents)} base</strong> includes {config.tools_included_base} tool. Each additional tool is <strong className="text-[var(--fg)]">{formatPrice(config.per_tool_extra_cents)}</strong>.
          Wholesale per key. White-label. Update notifications. Cancel any time.
        </p>

        {isReseller && (
          <div className="card p-4 inline-flex items-center gap-2 text-[13px] mt-6"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <Check size={13} className="text-[var(--ok)]" />
            <span>You&apos;re already a reseller. <Link href="/dashboard/resells" className="text-[var(--brand)] hover:underline">Manage resells →</Link></span>
          </div>
        )}
      </div>

      {/* Value props */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-14 max-w-[1000px] mx-auto">
        <Prop icon={<Boxes size={14} />}      title="Pick what you sell"     body="Choose any subset of our catalog. Add or remove tools any time." />
        <Prop icon={<Sparkles size={14} />}   title="White-label branding"   body="Your name, your image, your description per tool." />
        <Prop icon={<ShieldCheck size={14} />} title="Wholesale pricing"     body="Pay 25% of retail per key. Set your own markup." />
        <Prop icon={<Zap size={14} />}        title="Update fan-out"         body="Get pinged the second a product you resell ships an update." />
      </div>

      {/* Picker + checkout */}
      <ResellerCheckout
        products={products}
        config={config}
        signedIn={!!user}
        balanceCents={profile?.balance_cents ?? 0}
        isReseller={isReseller}
      />

      {/* FAQ */}
      <div className="max-w-[720px] mx-auto mt-20">
        <h2 className="text-[24px] font-bold tracking-tight text-center mb-2">Common questions</h2>
        <p className="text-[13.5px] text-[var(--fg-dim)] text-center mb-8">If we missed yours, open a ticket from your dashboard.</p>

        <div className="space-y-3">
          <FaqItem
            q="Can I add or remove tools later?"
            a={`Yes. You can purchase additional tool slots any time — each one is ${formatPrice(config.per_tool_extra_cents)}. Removing a tool revokes your right to generate new keys for it, but existing customer keys keep working.`}
          />
          <FaqItem
            q="What's the difference between Reseller and Rebrand?"
            a="Reseller = you sell our catalog with your branding, but checkout happens on onxy.cc. Rebrand = you get your OWN subdomain + admin panel + users. Rebrand is the next level up; see /rebrand for pricing."
          />
          <FaqItem
            q="Do I still pay per key after?"
            a="Yes — your plan unlocks reseller status. Each key you generate costs wholesale (~25% of retail). You sell to your customers at whatever price you want."
          />
          <FaqItem
            q="What if I want to cancel?"
            a="Monthly plans cancel at end of billing period. Yearly: pro-rated refund. Lifetime: paid once, runs forever."
          />
          <FaqItem
            q="Can I buy more tools after?"
            a="Yes. From /dashboard/resells you can upgrade your plan to add more tools whenever you need to."
          />
        </div>
      </div>
    </PublicShell>
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
