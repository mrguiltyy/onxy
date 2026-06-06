import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Boxes, ArrowRight, Clock, Check, X, RefreshCw } from 'lucide-react'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { formatPrice, relativeTime } from '@/lib/utils'

export const metadata = { title: 'My resells' }
export const dynamic = 'force-dynamic'

interface Profile { role: string }

interface Grant {
  id:             string
  product_id:     string
  status:         string
  custom_name:    string | null
  custom_image:   string | null
  discount_pct:   number
  created_at:     string
  approved_at:    string | null
}

interface Product {
  id:                      string
  slug:                    string
  name:                    string
  tagline:                 string | null
  version:                 string
  reseller_price_day:      number | null
  reseller_price_week:     number | null
  reseller_price_month:    number | null
  reseller_price_lifetime: number | null
}

interface Update {
  product_id: string
  version:    string
  title:      string
  severity:   string
  created_at: string
}

export default async function ResellsPage() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'super_admin' && role !== 'reseller') {
    redirect('/dashboard?error=reseller_only')
  }

  // Pull all the user's grants (any status)
  const { data: grantsRaw } = await supa
    .from('reseller_grants')
    .select('id, product_id, status, custom_name, custom_image, discount_pct, created_at, approved_at')
    .eq('reseller_id', user.id)
    .order('created_at', { ascending: false })
  const grants = (grantsRaw ?? []) as Grant[]

  // Pull the associated products via service role (RLS lets us see active anyway)
  const productIds = grants.map(g => g.product_id)
  const productMap = new Map<string, Product>()
  const updatesByProduct = new Map<string, Update>()
  if (productIds.length) {
    const admin = supabaseAdmin()
    const { data: prodsRaw } = await admin
      .from('products')
      .select('id, slug, name, tagline, version, reseller_price_day, reseller_price_week, reseller_price_month, reseller_price_lifetime')
      .in('id', productIds)
    for (const p of (prodsRaw as Product[] | null) ?? []) productMap.set(p.id, p)

    const { data: updsRaw } = await admin
      .from('product_updates')
      .select('product_id, version, title, severity, created_at')
      .in('product_id', productIds)
      .order('created_at', { ascending: false })
    for (const u of (updsRaw as Update[] | null) ?? []) {
      if (!updatesByProduct.has(u.product_id)) updatesByProduct.set(u.product_id, u)
    }
  }

  const approved = grants.filter(g => g.status === 'approved')
  const pending  = grants.filter(g => g.status === 'pending')
  const other    = grants.filter(g => g.status === 'rejected' || g.status === 'revoked')

  return (
    <div className="animate-in">
      <div className="mb-8">
        <p className="label-mono mb-2">Reseller program</p>
        <h1 className="text-[26px] font-bold tracking-tight">My resells</h1>
        <p className="text-[14px] text-[var(--fg-dim)] mt-1">
          Products you&apos;re approved to white-label. <Link href="/products" className="text-[var(--brand)] hover:underline">Browse more →</Link>
        </p>
      </div>

      {/* Approved */}
      {approved.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">Approved · {approved.length}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approved.map(g => {
              const p = productMap.get(g.product_id)
              const latest = updatesByProduct.get(g.product_id)
              const hasNewUpdate = latest && p && latest.version !== p.version
              return (
                <div key={g.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] truncate">{g.custom_name ?? p?.name ?? '—'}</p>
                      <p className="text-[11.5px] text-[var(--fg-mute)] font-mono truncate">
                        white-label of {p?.name ?? 'unknown'} · v{p?.version}
                      </p>
                    </div>
                    <Pill tone="ok">approved</Pill>
                  </div>

                  {/* Wholesale price */}
                  <div className="mb-4 space-y-1.5 text-[12px]">
                    {p?.reseller_price_month != null && (
                      <Row label="1 month" cents={p.reseller_price_month} discount={g.discount_pct} />
                    )}
                    {p?.reseller_price_lifetime != null && (
                      <Row label="Lifetime" cents={p.reseller_price_lifetime} discount={g.discount_pct} />
                    )}
                  </div>

                  {/* Latest update */}
                  {latest && (
                    <div className="rounded-md p-2.5 flex items-start gap-2 mb-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
                      <RefreshCw size={11} className="text-[var(--brand)] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] font-semibold truncate">
                          v{latest.version} · {latest.title}
                        </p>
                        <p className="text-[10.5px] text-[var(--fg-mute)]">{relativeTime(latest.created_at)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {p && (
                      <Link href={`/products/${p.slug}`} className="btn btn-secondary btn-sm flex-1">
                        View original
                      </Link>
                    )}
                    <Link href="/dashboard/generate" className="btn btn-primary btn-sm flex-1">
                      Generate key <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">Pending review · {pending.length}</h2>
          <div className="space-y-2">
            {pending.map(g => {
              const p = productMap.get(g.product_id)
              return (
                <div key={g.id} className="card px-4 py-3 flex items-center gap-3">
                  <Clock size={14} className="text-[var(--warn)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{g.custom_name ?? p?.name ?? 'Application'}</p>
                    <p className="text-[11px] text-[var(--fg-mute)]">submitted {relativeTime(g.created_at)}</p>
                  </div>
                  <Pill tone="warn">pending</Pill>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Rejected / revoked */}
      {other.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">Inactive</h2>
          <div className="space-y-2">
            {other.map(g => {
              const p = productMap.get(g.product_id)
              return (
                <div key={g.id} className="card px-4 py-3 flex items-center gap-3 opacity-60">
                  <X size={13} className="text-[var(--bad)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{g.custom_name ?? p?.name ?? 'Application'}</p>
                  </div>
                  <Pill tone="bad">{g.status}</Pill>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {grants.length === 0 && (
        <div className="card p-16 text-center">
          <Boxes size={32} className="mx-auto mb-3 text-[var(--fg-faint)]" />
          <p className="text-[14px] font-medium mb-1">No applications yet</p>
          <p className="text-[12.5px] text-[var(--fg-dim)] mb-5">Browse our products and apply to resell the ones you want.</p>
          <Link href="/products" className="btn btn-primary btn-sm inline-flex">
            Browse products <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  )
}

function Row({ label, cents, discount }: { label: string; cents: number; discount: number }) {
  const finalCents = discount > 0 ? Math.round(cents * (100 - discount) / 100) : cents
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--fg-mute)]">{label}</span>
      <span className="font-mono">
        <span className={discount > 0 ? 'line-through text-[var(--fg-mute)] mr-1.5' : 'text-[var(--brand)]'}>{formatPrice(cents)}</span>
        {discount > 0 && <span className="text-[var(--brand)]">{formatPrice(finalCents)}</span>}
        <span className="text-[var(--fg-mute)]"> / key</span>
      </span>
    </div>
  )
}
