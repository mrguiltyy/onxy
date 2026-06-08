import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Key, ArrowRight, Shield, Zap } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { ApiDocsExplorer } from './ApiDocsExplorer'

export const metadata = { title: 'API docs · Reseller' }
export const dynamic = 'force-dynamic'

interface KeyOption { id: string; key_prefix: string; name: string }
interface ProductOption { id: string; name: string }
interface Profile { role: string }

export default async function ApiDocsPage() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'reseller' && role !== 'super_admin') {
    redirect('/dashboard?error=reseller_only')
  }

  // Their seller keys
  const { data: keysRaw } = await supa
    .from('seller_keys')
    .select('id, key_prefix, name')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: false })
  const keys = (keysRaw as KeyOption[] | null) ?? []

  // Their approved products
  const { data: grantsRaw } = await supa
    .from('reseller_grants').select('product_id').eq('reseller_id', user.id).eq('status', 'approved')
  const productIds = ((grantsRaw as { product_id: string }[] | null) ?? []).map(g => g.product_id)

  let products: ProductOption[] = []
  if (productIds.length > 0) {
    const { data: prodsRaw } = await supa.from('products').select('id, name').in('id', productIds)
    products = (prodsRaw as ProductOption[] | null) ?? []
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onxy.cc'
  const apiBase = `${siteUrl}/api/seller/v1/`

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label-mono mb-2">Developer</p>
          <h1 className="text-[26px] font-bold tracking-tight flex items-center gap-2">
            <Shield size={22} className="text-[var(--brand)]" />
            API reference
          </h1>
          <p className="text-[14px] text-[var(--fg-dim)] mt-1 max-w-[640px]">
            Hi <strong className="text-[var(--fg)]">@{user.email?.split('@')[0]}</strong> — these endpoints let you build your own panel,
            programmatically generate license keys, manage HWIDs, and integrate OP. All endpoints are scoped to your account.
          </p>
        </div>
        <Link href="/dashboard/api-keys" className="btn btn-secondary btn-sm">
          <Key size={12} /> Manage API keys
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <Stat label="Allowed" value="11" sub="endpoints" />
        <Stat label="Languages" value="14" sub="code snippets" />
        <Stat label="Method" value="GET" sub="all endpoints" />
        <Stat label="Projects" value={products.length.toString()} sub={products.length === 1 ? 'product' : 'products'} />
        <Stat label="Access" value={role === 'super_admin' ? 'Master' : 'Sub Reseller'} sub="your tier" accent />
      </div>

      {/* No API keys warning */}
      {keys.length === 0 && (
        <div className="rounded-md p-4 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.25)' }}>
          <Zap size={14} className="text-[var(--warn)] mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-[13.5px] mb-1 text-[var(--warn)]">No API keys yet</p>
            <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed mb-3">
              You need at least one API key to test these endpoints. Create one to get started.
            </p>
            <Link href="/dashboard/api-keys" className="btn btn-primary btn-sm">
              Create API key <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      )}

      <ApiDocsExplorer apiBase={apiBase} keys={keys} products={products} />
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="card p-3.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-mute)] mb-1">{label}</p>
      <p className="text-[18px] font-bold tabular-nums"
        style={{ color: accent ? 'var(--brand)' : 'var(--fg)', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      <p className="text-[10px] text-[var(--fg-mute)]">{sub}</p>
    </div>
  )
}
