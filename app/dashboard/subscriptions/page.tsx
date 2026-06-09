import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, Clock, Check, Infinity as InfinityIcon, ArrowRight, AlertTriangle, RefreshCw, Boxes } from 'lucide-react'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { formatPrice, relativeTime } from '@/lib/utils'
import { Pill } from '@/components/ui/Pill'

export const metadata = { title: 'My subscriptions' }
export const dynamic = 'force-dynamic'

interface Subscription {
  id:                string
  product_id:        string
  duration_key:      string
  duration_days:     number | null
  started_at:        string
  expires_at:        string | null
  status:            string
  amount_paid_cents: number
  renewed_count:     number
  last_renewed_at:   string | null
}

interface Product {
  id:        string
  slug:      string
  name:      string
  image_url: string | null
  tagline:   string | null
}

export default async function SubscriptionsPage() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  // Pull all subs
  let subs: Subscription[] = []
  try {
    const { data } = await supa
      .from('subscriptions')
      .select('id, product_id, duration_key, duration_days, started_at, expires_at, status, amount_paid_cents, renewed_count, last_renewed_at')
      .eq('user_id', user.id)
      .order('expires_at', { ascending: false, nullsFirst: true })
    subs = (data as Subscription[] | null) ?? []
  } catch { /* table missing */ }

  // Mark any that should be expired
  const now = Date.now()
  for (const s of subs) {
    if (s.status === 'active' && s.expires_at && new Date(s.expires_at).getTime() < now) {
      s.status = 'expired'
    }
  }

  const productMap = new Map<string, Product>()
  if (subs.length > 0) {
    const admin = supabaseAdmin()
    const productIds = [...new Set(subs.map(s => s.product_id))]
    const { data: prodsRaw } = await admin
      .from('products')
      .select('id, slug, name, image_url, tagline')
      .in('id', productIds)
    for (const p of (prodsRaw as Product[] | null) ?? []) productMap.set(p.id, p)
  }

  const active   = subs.filter(s => s.status === 'active')
  const expired  = subs.filter(s => s.status === 'expired')
  const canceled = subs.filter(s => s.status === 'canceled')

  const totalSpent = subs.reduce((a, s) => a + s.amount_paid_cents, 0)

  return (
    <div className="animate-in max-w-[960px]">
      <div className="mb-8">
        <p className="label-mono mb-2">Your account</p>
        <h1 className="text-[26px] font-bold tracking-tight">Subscriptions &amp; plans</h1>
        <p className="text-[13.5px] text-[var(--fg-dim)] mt-1">
          Manage your active services. Lifetime plans never expire. Time-based plans extend when you buy more time.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Active"        value={active.length.toString()}   tone="ok" />
        <Stat label="Total spent"   value={formatPrice(totalSpent)}     tone="brand" />
        <Stat label="All-time"      value={subs.length.toString()}      tone="muted" />
      </div>

      {subs.length === 0 ? (
        <div className="card p-16 text-center max-w-[440px] mx-auto">
          <Boxes size={32} className="mx-auto mb-3 text-[var(--fg-faint)]" />
          <p className="text-[15px] font-semibold mb-1">No subscriptions yet</p>
          <p className="text-[12.5px] text-[var(--fg-dim)] mb-5 leading-relaxed">
            Browse the catalog and subscribe to any service to unlock it.
          </p>
          <Link href="/products" className="btn btn-primary btn-sm inline-flex">
            Browse products <ArrowRight size={11} />
          </Link>
        </div>
      ) : (
        <>
          {/* Active */}
          {active.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--ok)] mb-3">
                Active · {active.length}
              </h2>
              <div className="space-y-3">
                {active.map(s => <SubCard key={s.id} sub={s} product={productMap.get(s.product_id)} />)}
              </div>
            </section>
          )}

          {/* Expired */}
          {expired.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">
                Expired · {expired.length}
              </h2>
              <div className="space-y-2">
                {expired.slice(0, 10).map(s => <SubCard key={s.id} sub={s} product={productMap.get(s.product_id)} compact />)}
              </div>
            </section>
          )}

          {/* Canceled */}
          {canceled.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">
                Canceled · {canceled.length}
              </h2>
              <div className="space-y-2">
                {canceled.slice(0, 5).map(s => <SubCard key={s.id} sub={s} product={productMap.get(s.product_id)} compact />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'brand' | 'muted' }) {
  const color = tone === 'ok' ? 'var(--ok)' : tone === 'brand' ? 'var(--brand)' : 'var(--fg-dim)'
  return (
    <div className="card p-4">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--fg-mute)] mb-1">{label}</p>
      <p className="text-[22px] font-bold tabular-nums" style={{ color, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function SubCard({ sub, product, compact }: { sub: Subscription; product?: Product; compact?: boolean }) {
  const isLifetime = sub.expires_at === null
  const daysLeft = sub.expires_at
    ? Math.floor((new Date(sub.expires_at).getTime() - Date.now()) / 86_400_000)
    : null
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft < 3

  return (
    <div className="card overflow-hidden" style={{
      background: sub.status === 'expired' ? 'var(--surface)' : 'var(--surface)',
      opacity: sub.status === 'expired' || sub.status === 'canceled' ? 0.7 : 1,
    }}>
      <div className="flex items-center gap-4 p-4">
        {/* Product image */}
        <div
          className="w-14 h-14 rounded-md shrink-0"
          style={{
            background: product?.image_url
              ? `url(${product.image_url}) center/cover`
              : 'linear-gradient(135deg, rgba(240,164,183,0.20), rgba(162,200,238,0.20))',
            border: '1px solid var(--hairline)',
          }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-bold text-[14.5px] truncate">{product?.name ?? 'Product'}</p>
            {sub.status === 'active' && isLifetime && (
              <Pill tone="ok"><InfinityIcon size={9} className="inline mr-0.5" /> Lifetime</Pill>
            )}
            {sub.status === 'active' && !isLifetime && expiringSoon && (
              <Pill tone="warn"><AlertTriangle size={9} className="inline mr-0.5" /> Expiring soon</Pill>
            )}
            {sub.status === 'expired' && <Pill tone="bad">Expired</Pill>}
            {sub.status === 'canceled' && <Pill tone="warn">Canceled</Pill>}
            {sub.renewed_count > 0 && (
              <span className="text-[10px] text-[var(--fg-mute)] font-mono inline-flex items-center gap-1">
                <RefreshCw size={9} /> renewed {sub.renewed_count}×
              </span>
            )}
          </div>

          {!compact && product?.tagline && (
            <p className="text-[11.5px] text-[var(--fg-dim)] truncate">{product.tagline}</p>
          )}

          <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--fg-mute)] flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar size={10} />
              Plan: <strong className="text-[var(--fg-dim)]">{sub.duration_key}</strong>
            </span>
            {!isLifetime && sub.expires_at && (
              <span className="inline-flex items-center gap-1">
                <Clock size={10} />
                {sub.status === 'active'
                  ? `Expires ${new Date(sub.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${daysLeft}d left)`
                  : `Expired ${relativeTime(sub.expires_at)}`}
              </span>
            )}
            {isLifetime && (
              <span className="inline-flex items-center gap-1 text-[var(--ok)]">
                <Check size={10} /> Never expires
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[14px] font-bold tabular-nums">{formatPrice(sub.amount_paid_cents)}</span>
          {product && (
            <Link href={`/products/${product.slug}`} className="text-[11.5px] text-[var(--brand)] hover:underline inline-flex items-center gap-1">
              {sub.status === 'active' ? 'Extend' : 'Renew'} <ArrowRight size={9} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
