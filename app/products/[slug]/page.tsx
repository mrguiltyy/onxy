import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Check, Infinity, Shield, RefreshCw, ArrowRight, Calendar, Sparkles } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { ResellApplicationButton } from './ResellApplicationButton'

export const dynamic = 'force-dynamic'

interface Product {
  id:                       string
  slug:                     string
  name:                     string
  tagline:                  string | null
  description:              string | null
  image_url:                string | null
  category:                 string
  version:                  string
  price_day:                number | null
  price_week:               number | null
  price_month:              number | null
  price_lifetime:           number | null
  reseller_price_day:       number | null
  reseller_price_week:      number | null
  reseller_price_month:     number | null
  reseller_price_lifetime:  number | null
  reseller_open:            boolean
  lifetime_support:         boolean
  features:                 string[]
}

interface Update {
  id:         string
  version:    string
  title:      string
  notes:      string | null
  severity:   string
  created_at: string
}

interface Profile { role: string }
interface Grant { status: string }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await supabaseAdmin().from('products').select('name, tagline').eq('slug', slug).maybeSingle()
  const p = data as { name: string; tagline?: string } | null
  return { title: p ? `${p.name} · OP` : 'Product' }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const admin = supabaseAdmin()
  const { data: pRaw } = await admin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  const product = pRaw as Product | null
  if (!product) notFound()

  const { data: updatesRaw } = await admin
    .from('product_updates')
    .select('id, version, title, notes, severity, created_at')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(5)
  const updates = (updatesRaw ?? []) as Update[]

  // Logged-in context (for the resell button)
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  let role: string | null = null
  let existingGrantStatus: string | null = null
  if (user) {
    const { data: profRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
    role = (profRaw as Profile | null)?.role ?? null
    const { data: grantRaw } = await supa.from('reseller_grants')
      .select('status').eq('product_id', product.id).eq('reseller_id', user.id).maybeSingle()
    existingGrantStatus = (grantRaw as Grant | null)?.status ?? null
  }

  return (
    <PublicShell wide>
      <Link href="/products" className="text-[12.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 mb-6">
        ← All products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        {/* Left: hero + description + features */}
        <div>
          {/* Banner */}
          <div
            className="h-56 rounded-md mb-6 relative overflow-hidden"
            style={{
              background: product.image_url
                ? `url(${product.image_url}) center/cover`
                : 'linear-gradient(135deg, rgba(240,164,183,0.25), rgba(162,200,238,0.25))',
              border: '1px solid var(--hairline)',
            }}
          >
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded-md"
                style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                {product.category}
              </span>
              <span className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded-md"
                style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                v{product.version}
              </span>
            </div>
          </div>

          <p className="label-mono mb-3">Product</p>
          <h1 className="text-[36px] font-bold tracking-tight mb-2" style={{ letterSpacing: '-0.025em' }}>{product.name}</h1>
          {product.tagline && <p className="text-[16px] text-[var(--fg-dim)] mb-8 max-w-[640px]">{product.tagline}</p>}

          {product.features.length > 0 && (
            <div className="mb-10">
              <h2 className="font-semibold text-[15px] mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--brand)]" /> What you get
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13.5px] text-[var(--fg-dim)]">
                    <span className="w-4 h-4 rounded flex items-center justify-center mt-0.5 shrink-0" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
                      <Check size={10} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.description && (
            <div className="mb-10">
              <h2 className="font-semibold text-[15px] mb-3">Description</h2>
              <div className="text-[13.5px] text-[var(--fg-dim)] leading-[1.75] whitespace-pre-wrap">{product.description}</div>
            </div>
          )}

          {/* Release history */}
          {updates.length > 0 && (
            <div className="mb-10">
              <h2 className="font-semibold text-[15px] mb-3 flex items-center gap-2">
                <RefreshCw size={13} className="text-[var(--brand)]" /> Release history
              </h2>
              <div className="space-y-3">
                {updates.map(u => (
                  <div key={u.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[13px]">v{u.version}</span>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
                        {u.severity}
                      </span>
                      <span className="text-[11px] text-[var(--fg-mute)] ml-auto">{new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[13px] font-medium text-[var(--fg)]">{u.title}</p>
                    {u.notes && <p className="text-[12.5px] text-[var(--fg-dim)] mt-1 whitespace-pre-wrap">{u.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.lifetime_support && (
            <div
              className="rounded-md p-5 flex items-start gap-3"
              style={{ background: 'var(--brand-faint)', border: '1px solid rgba(59,130,246,0.25)' }}
            >
              <Infinity size={18} className="text-[var(--brand)] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-[13.5px] mb-1">Lifetime buyers get ongoing support</p>
                <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed">
                  Buy the lifetime tier and we handle your tickets directly. Updates, bug fixes, hardware-change HWID resets,
                  and integration help — all included for as long as the product is maintained.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: pricing sticky panel */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <div className="card p-5">
            <p className="label-mono mb-4">Pricing</p>
            <div className="space-y-2">
              <PriceRow label="1 day"      cents={product.price_day}      icon={<Calendar size={11} />} />
              <PriceRow label="1 week"     cents={product.price_week}     icon={<Calendar size={11} />} />
              <PriceRow label="1 month"    cents={product.price_month}    icon={<Calendar size={11} />} />
              <PriceRow label="Lifetime"   cents={product.price_lifetime} icon={<Infinity size={11} />} highlight />
            </div>
            <Link href={user ? '/dashboard/generate' : '/register'} className="btn btn-primary w-full mt-4">
              {user ? 'Generate key' : 'Sign up to buy'} <ArrowRight size={13} />
            </Link>
            <p className="text-[10.5px] text-[var(--fg-mute)] text-center mt-3">
              Secure payment via Stripe · instant key delivery
            </p>
          </div>

          {/* Reseller card */}
          {product.reseller_open && (
            <div
              className="card p-5"
              style={{ background: 'linear-gradient(135deg, rgba(240,164,183,0.04), rgba(162,200,238,0.04))' }}
            >
              <p className="label-mono mb-2">Reseller program</p>
              <h3 className="font-semibold text-[14px] mb-1">White-label this tool</h3>
              <p className="text-[12px] text-[var(--fg-dim)] mb-3 leading-relaxed">
                Approved resellers pay wholesale and apply their own branding.
              </p>
              <div className="space-y-1.5 mb-4">
                <WholesalePrice label="1 month" cents={product.reseller_price_month} />
                <WholesalePrice label="Lifetime" cents={product.reseller_price_lifetime} />
              </div>
              <ResellApplicationButton
                productId={product.id}
                productName={product.name}
                signedIn={!!user}
                isReseller={role === 'reseller' || role === 'super_admin'}
                existingGrantStatus={existingGrantStatus}
              />
            </div>
          )}

          <div className="card p-4 flex items-center gap-2">
            <Shield size={12} className="text-[var(--ok)]" />
            <p className="text-[11.5px] text-[var(--fg-dim)]">Auth + HWID built-in. No setup needed.</p>
          </div>
        </div>
      </div>
    </PublicShell>
  )
}

function PriceRow({ label, cents, icon, highlight }: { label: string; cents: number | null; icon: React.ReactNode; highlight?: boolean }) {
  if (cents === null || cents === undefined) return null
  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 rounded-md"
      style={highlight
        ? { background: 'var(--brand-faint)', border: '1px solid rgba(59,130,246,0.25)' }
        : { background: 'var(--surface-2)' }
      }
    >
      <span className="flex items-center gap-2 text-[12.5px]" style={{ color: highlight ? 'var(--brand)' : 'var(--fg-dim)' }}>
        {icon} {label}
      </span>
      <span className="font-bold tabular-nums text-[14px]">{formatPrice(cents)}</span>
    </div>
  )
}

function WholesalePrice({ label, cents }: { label: string; cents: number | null }) {
  if (cents === null || cents === undefined) return null
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-[var(--fg-mute)]">{label}</span>
      <span className="font-mono text-[var(--brand)]">{formatPrice(cents)} <span className="text-[var(--fg-mute)]">/ key</span></span>
    </div>
  )
}
