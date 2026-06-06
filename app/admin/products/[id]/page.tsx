import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink, Trash2, RefreshCw } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { relativeTime } from '@/lib/utils'
import { ProductForm } from '../ProductForm'
import { DeleteProductButton, PublishUpdateButton } from './controls'

export const metadata = { title: 'Edit product · Admin' }
export const dynamic = 'force-dynamic'

interface Product {
  id:                      string
  slug:                    string
  name:                    string
  tagline:                 string | null
  description:             string | null
  image_url:               string | null
  category:                string
  version:                 string
  status:                  string
  featured:                boolean
  features:                string[]
  price_day:               number | null
  price_week:              number | null
  price_month:             number | null
  price_lifetime:          number | null
  reseller_price_day:      number | null
  reseller_price_week:     number | null
  reseller_price_month:    number | null
  reseller_price_lifetime: number | null
  reseller_open:           boolean
  reseller_auto_approve:   boolean
  lifetime_support:        boolean
}

interface Update {
  id:         string
  version:    string
  title:      string
  notes:      string | null
  severity:   string
  created_at: string
}

export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = supabaseAdmin()

  const { data: pRaw } = await admin.from('products').select('*').eq('id', id).maybeSingle()
  const product = pRaw as Product | null
  if (!product) notFound()

  const { data: updsRaw } = await admin
    .from('product_updates')
    .select('id, version, title, notes, severity, created_at')
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .limit(20)
  const updates = (updsRaw as Update[] | null) ?? []

  return (
    <div>
      <Link href="/admin/products" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 mb-4">
        <ChevronLeft size={13} /> All products
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[24px] font-bold tracking-tight">{product.name}</h1>
            <Pill tone={product.status === 'active' ? 'ok' : product.status === 'paused' ? 'warn' : 'bad'}>{product.status}</Pill>
          </div>
          <p className="text-[12.5px] text-[var(--fg-dim)] font-mono">
            slug: <span className="text-[var(--brand)]">{product.slug}</span> · v{product.version}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/products/${product.slug}`} target="_blank" className="btn btn-secondary btn-sm">
            <ExternalLink size={12} /> Public page
          </Link>
          <PublishUpdateButton productId={product.id} currentVersion={product.version} />
          <DeleteProductButton productId={product.id} name={product.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <ProductForm initial={product} />
        </div>

        {/* Update history */}
        <div>
          <div className="card">
            <div className="px-4 py-3 border-b border-[var(--hairline)] flex items-center gap-2">
              <RefreshCw size={12} className="text-[var(--brand)]" />
              <h2 className="font-semibold text-[13px]">Release history</h2>
            </div>
            <div className="p-2 space-y-1.5 max-h-[600px] overflow-y-auto">
              {updates.length === 0 ? (
                <p className="px-3 py-6 text-center text-[12px] text-[var(--fg-mute)]">No releases logged yet.</p>
              ) : updates.map(u => (
                <div key={u.id} className="px-3 py-2.5 rounded-md hover:bg-[var(--surface-2)] transition-colors">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[12px] font-semibold text-[var(--brand)]">v{u.version}</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
                      {u.severity}
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-[var(--fg)]">{u.title}</p>
                  {u.notes && <p className="text-[11px] text-[var(--fg-dim)] mt-0.5 whitespace-pre-wrap line-clamp-3">{u.notes}</p>}
                  <p className="text-[10px] text-[var(--fg-mute)] mt-1">{relativeTime(u.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
