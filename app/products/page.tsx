import Link from 'next/link'
import { ArrowRight, Star, Infinity, Shield, RefreshCw } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

export const metadata = { title: 'Products · OP' }
export const dynamic = 'force-dynamic'

interface Product {
  id:               string
  slug:             string
  name:             string
  tagline:          string | null
  description:      string | null
  image_url:        string | null
  category:         string
  version:          string
  price_day:        number | null
  price_week:       number | null
  price_month:      number | null
  price_lifetime:   number | null
  reseller_open:    boolean
  lifetime_support: boolean
  features:         string[]
  featured:         boolean
}

export default async function ProductsPage() {
  const admin = supabaseAdmin()
  const { data: productsRaw } = await admin
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const products = (productsRaw ?? []) as Product[]

  return (
    <PublicShell wide>
      <div className="mb-12">
        <p className="label-mono mb-3">Marketplace</p>
        <h1 className="text-[40px] md:text-[48px] font-bold tracking-tight leading-[1.05]" style={{ letterSpacing: '-0.03em' }}>
          Private tools,<br />
          <span style={{
            background: 'var(--brand-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>built right.</span>
        </h1>
        <p className="text-[15px] text-[var(--fg-dim)] mt-5 max-w-[560px] leading-relaxed">
          Each tool ships with our auth engine baked in — HWID-locked, banlist-enforced, updated automatically.
          Lifetime buyers get ongoing support. Resellers can rebrand and white-label any product below.
        </p>
      </div>

      {/* Value props row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
        <Prop icon={<Shield size={14} />} title="Auth + HWID built-in" body="Every tool uses our hardened auth engine — license-key + hardware lock + per-IP throttling." />
        <Prop icon={<RefreshCw size={14} />} title="Lifetime updates" body="Tools we publish stay current. You get every release automatically — no extra cost." />
        <Prop icon={<Star size={14} />} title="White-label reselling" body="Reseller tier? Pick any tool, set your own branding, generate keys at wholesale." />
      </div>

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-[14px] text-[var(--fg-dim)]">No products listed yet — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}

      {/* Reseller call-to-action */}
      <div
        className="mt-16 rounded-md p-8 flex items-center justify-between flex-wrap gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(240,164,183,0.06), rgba(162,200,238,0.06))',
          border: '1px solid var(--hairline)',
        }}
      >
        <div>
          <p className="label-mono mb-2">Reseller program</p>
          <h2 className="text-[22px] font-bold tracking-tight mb-1">Resell our tools, your brand on top.</h2>
          <p className="text-[13.5px] text-[var(--fg-dim)] max-w-[560px]">
            White-label any active product, set your own name and image, generate keys at wholesale pricing,
            and get notified the second we ship an update.
          </p>
        </div>
        <Link href="/register" className="btn btn-primary">
          Apply for reseller <ArrowRight size={13} />
        </Link>
      </div>
    </PublicShell>
  )
}

function Prop({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
          {icon}
        </span>
        <p className="font-semibold text-[13.5px]">{title}</p>
      </div>
      <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed">{body}</p>
    </div>
  )
}

function ProductCard({ p }: { p: Product }) {
  const fromPrice = p.price_day ?? p.price_week ?? p.price_month ?? p.price_lifetime
  return (
    <Link
      href={`/products/${p.slug}`}
      className="card card-hover overflow-hidden flex flex-col group"
      style={{ height: '100%' }}
    >
      {/* Image / banner */}
      <div
        className="h-32 relative overflow-hidden"
        style={{
          background: p.image_url
            ? `url(${p.image_url}) center/cover`
            : 'linear-gradient(135deg, rgba(240,164,183,0.20), rgba(162,200,238,0.20))',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        {p.featured && (
          <span
            className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
            style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}
          >
            <Star size={9} className="inline mr-1" /> Featured
          </span>
        )}
        {p.price_lifetime && (
          <span
            className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1"
            style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(6px)' }}
          >
            <Infinity size={10} /> Lifetime
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-[15px] truncate flex-1">{p.name}</h3>
          <span className="text-[10px] text-[var(--fg-mute)] font-mono uppercase tracking-wider">v{p.version}</span>
        </div>
        {p.tagline && <p className="text-[12.5px] text-[var(--fg-dim)] line-clamp-2 mb-3">{p.tagline}</p>}

        {p.features.length > 0 && (
          <ul className="mb-4 space-y-1">
            {p.features.slice(0, 3).map((f, i) => (
              <li key={i} className="text-[12px] text-[var(--fg-dim)] flex items-start gap-1.5">
                <span className="text-[var(--brand)] mt-0.5">·</span> {f}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-3 border-t flex items-end justify-between" style={{ borderColor: 'var(--hairline)' }}>
          {fromPrice !== null && fromPrice !== undefined ? (
            <div>
              <p className="text-[10.5px] text-[var(--fg-mute)] uppercase tracking-wider">From</p>
              <p className="text-[18px] font-bold tabular-nums" style={{ letterSpacing: '-0.02em' }}>{formatPrice(fromPrice)}</p>
            </div>
          ) : <span />}
          <span className="text-[12.5px] text-[var(--brand)] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            View <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  )
}
