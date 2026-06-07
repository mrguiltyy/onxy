import Link from 'next/link'
import { ArrowRight, Boxes } from 'lucide-react'
import { PublicShell } from '@/components/PublicShell'
import { supabaseAdmin } from '@/lib/supabase/server'

export const metadata = { title: 'Products · OP' }
export const dynamic = 'force-dynamic'

interface Product {
  id:              string
  slug:            string
  name:            string
  tagline:         string | null
  description:     string | null
  image_url:       string | null
  category:        string
  version:         string
  price_day:       number | null
  price_week:      number | null
  price_month:     number | null
  price_lifetime:  number | null
  reseller_open:   boolean
  lifetime_support:boolean
  features:        string[]
  featured:        boolean
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
      <div className="mb-12 flex items-end justify-between flex-wrap gap-6">
        <div>
          <p className="label-mono mb-3">Store</p>
          <h1 className="text-[36px] md:text-[44px] font-bold tracking-tight leading-[1.05]" style={{ letterSpacing: '-0.025em' }}>
            All our tools.
          </h1>
          <p className="text-[14px] text-[var(--fg-dim)] mt-3 max-w-[520px] leading-relaxed">
            Every tool ships with our auth engine — HWID-locked, banlist-enforced, instantly updated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--fg-mute)] px-3 py-1.5 rounded-full"
            style={{ background: 'var(--brand-faint)', border: '1px solid rgba(240,164,183,0.25)', color: 'var(--brand)' }}>
            {products.length} {products.length === 1 ? 'tool' : 'tools'}
          </span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card p-16 text-center">
          <Boxes size={32} className="mx-auto mb-3 text-[var(--fg-faint)]" />
          <p className="text-[14px] text-[var(--fg-dim)]">No tools listed yet — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {products.map(p => <ProductTile key={p.id} p={p} />)}
        </div>
      )}

      {/* Reseller CTA */}
      <div
        className="mt-20 rounded-md p-8 flex items-center justify-between flex-wrap gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(240,164,183,0.06), rgba(162,200,238,0.06))',
          border: '1px solid var(--hairline)',
        }}
      >
        <div>
          <p className="label-mono mb-2">Reseller program</p>
          <h2 className="text-[22px] font-bold tracking-tight mb-1">Sell these tools under your name.</h2>
          <p className="text-[13.5px] text-[var(--fg-dim)] max-w-[560px]">
            Pick any tools, set your own branding, generate keys at wholesale. $15 base + $5 per extra tool.
          </p>
        </div>
        <Link href="/reseller" className="btn btn-primary">
          See reseller pricing <ArrowRight size={13} />
        </Link>
      </div>
    </PublicShell>
  )
}

// ────────────────────────────────────────────────────────────────
// Cosmocheats-style product tile
// ────────────────────────────────────────────────────────────────
function ProductTile({ p }: { p: Product }) {
  // Heuristic accent based on the product slug hash for variety in the grid
  const accents = [
    { from: '#7a2cdf', to:  '#3a0f6e' },   // purple
    { from: '#dd2c87', to:  '#6e0f47' },   // pink
    { from: '#2c5cdf', to:  '#0f2f6e' },   // blue
    { from: '#df652c', to:  '#6e370f' },   // orange
    { from: '#1fb38c', to:  '#0f5e4a' },   // teal
    { from: '#df2c4f', to:  '#6e0f1a' },   // red
  ]
  const i = hashCode(p.slug) % accents.length
  const accent = accents[i]

  return (
    <Link
      href={`/products/${p.slug}`}
      className="group relative aspect-[16/10] rounded-md overflow-hidden block transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.40)]"
      style={{
        background: p.image_url
          ? `linear-gradient(135deg, ${accent.from}99 0%, ${accent.to}cc 100%), url(${p.image_url}) center/cover`
          : `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Diagonal slash decoration in top-left (the "////" brand mark) */}
      <div className="absolute top-2 left-2.5 flex items-center gap-1.5 pointer-events-none">
        <span
          className="block w-3.5 h-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.55)', transform: 'skewX(-30deg)' }}
        />
        <span className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-white/70">
          OP // {p.category}
        </span>
      </div>

      {/* Bottom-left gradient bar for depth */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
        }}
      />

      {/* Big bold product name — bottom-left */}
      <div className="absolute left-3 right-3 bottom-3">
        <h3
          className="text-[15px] md:text-[18px] font-black uppercase tracking-tight leading-[0.95] text-white"
          style={{
            letterSpacing: '-0.02em',
            textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {p.name}
        </h3>
      </div>

      {/* Featured ribbon (top-right) */}
      {p.featured && (
        <span
          className="absolute top-2 right-2 text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
          style={{
            background: 'rgba(255,255,255,0.92)',
            color: accent.to,
          }}
        >
          ★ Featured
        </span>
      )}

      {/* Hover overlay → subtle brand glow + "View" badge */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(240,164,183,0.20), rgba(162,200,238,0.20))',
        }}
      >
        <span
          className="text-[10.5px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.95)',
            color: '#3a2630',
          }}
        >
          View →
        </span>
      </div>
    </Link>
  )
}

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}
