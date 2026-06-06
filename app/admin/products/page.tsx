import Link from 'next/link'
import { Plus, ExternalLink, Edit2 } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { formatPrice, relativeTime } from '@/lib/utils'

export const metadata = { title: 'Products · Admin' }
export const dynamic = 'force-dynamic'

interface Product {
  id:             string
  slug:           string
  name:           string
  category:       string
  status:         string
  version:        string
  featured:       boolean
  price_lifetime: number | null
  created_at:     string
}

export default async function AdminProductsPage() {
  const admin = supabaseAdmin()
  const { data: productsRaw } = await admin
    .from('products')
    .select('id, slug, name, category, status, version, featured, price_lifetime, created_at')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const products = (productsRaw ?? []) as Product[]

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">Products</h1>
          <p className="text-[13px] text-[var(--fg-dim)] mt-1">Manage your tool catalog and pricing.</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <Plus size={13} /> New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[14px] text-[var(--fg-dim)] mb-4">No products yet.</p>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm inline-flex">
            <Plus size={12} /> Create your first product
          </Link>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Version</th>
                <th>Lifetime price</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="font-medium text-[var(--fg)]">
                    {p.featured && <span className="text-[10px] mr-1.5 text-[var(--brand)]">★</span>}
                    {p.name}
                  </td>
                  <td><code className="font-mono text-[12px] text-[var(--brand)]">{p.slug}</code></td>
                  <td className="text-[12.5px] text-[var(--fg-dim)] capitalize">{p.category}</td>
                  <td className="font-mono text-[12px]">v{p.version}</td>
                  <td className="tabular-nums text-[12.5px]">{p.price_lifetime != null ? formatPrice(p.price_lifetime) : '—'}</td>
                  <td>
                    <Pill tone={p.status === 'active' ? 'ok' : p.status === 'paused' ? 'warn' : 'bad'}>{p.status}</Pill>
                  </td>
                  <td className="text-[12px] text-[var(--fg-dim)]">{relativeTime(p.created_at)}</td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link href={`/products/${p.slug}`} target="_blank" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1">
                        <ExternalLink size={11} />
                      </Link>
                      <Link href={`/admin/products/${p.id}`} className="text-[12px] text-[var(--brand)] hover:underline inline-flex items-center gap-1">
                        <Edit2 size={11} /> Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
