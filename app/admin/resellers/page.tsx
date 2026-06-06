import { supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { relativeTime } from '@/lib/utils'
import { GrantActions } from './GrantActions'

export const metadata = { title: 'Resellers · Admin' }
export const dynamic = 'force-dynamic'

interface Grant {
  id:             string
  product_id:     string
  reseller_id:    string
  status:         string
  custom_name:    string | null
  custom_image:   string | null
  pitch:          string | null
  discount_pct:   number
  created_at:     string
  approved_at:    string | null
  rejected_reason: string | null
}

interface Product { id: string; name: string; slug: string }
interface Profile { id: string; username: string; email: string; role: string }

export default async function AdminResellersPage() {
  const admin = supabaseAdmin()

  const { data: grantsRaw } = await admin
    .from('reseller_grants')
    .select('id, product_id, reseller_id, status, custom_name, custom_image, pitch, discount_pct, created_at, approved_at, rejected_reason')
    .order('created_at', { ascending: false })
    .limit(200)
  const grants = (grantsRaw as Grant[] | null) ?? []

  const productIds = [...new Set(grants.map(g => g.product_id))]
  const resellerIds = [...new Set(grants.map(g => g.reseller_id))]

  const productMap = new Map<string, Product>()
  const profileMap = new Map<string, Profile>()

  if (productIds.length) {
    const { data: pRaw } = await admin.from('products').select('id, name, slug').in('id', productIds)
    for (const p of (pRaw as Product[] | null) ?? []) productMap.set(p.id, p)
  }
  if (resellerIds.length) {
    const { data: profRaw } = await admin.from('profiles').select('id, username, email, role').in('id', resellerIds)
    for (const p of (profRaw as Profile[] | null) ?? []) profileMap.set(p.id, p)
  }

  const pending  = grants.filter(g => g.status === 'pending')
  const approved = grants.filter(g => g.status === 'approved')
  const other    = grants.filter(g => g.status !== 'pending' && g.status !== 'approved')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-bold tracking-tight">Reseller program</h1>
        <p className="text-[13px] text-[var(--fg-dim)] mt-1">Review applications and manage active resellers per product.</p>
      </div>

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--warn)] mb-3">
            Pending review · {pending.length}
          </h2>
          <div className="space-y-3">
            {pending.map(g => (
              <ApplicationCard key={g.id} g={g} product={productMap.get(g.product_id)} profile={profileMap.get(g.reseller_id)} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">
          Approved · {approved.length}
        </h2>
        {approved.length === 0 ? (
          <p className="card p-8 text-center text-[12.5px] text-[var(--fg-mute)]">No approved resellers yet.</p>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Branded name</th>
                  <th>Reseller</th>
                  <th>Product</th>
                  <th>Discount</th>
                  <th>Since</th>
                </tr>
              </thead>
              <tbody>
                {approved.map(g => {
                  const p = productMap.get(g.product_id)
                  const u = profileMap.get(g.reseller_id)
                  return (
                    <tr key={g.id}>
                      <td className="font-medium">{g.custom_name ?? '—'}</td>
                      <td className="text-[12.5px]">
                        <p className="text-[var(--fg)]">{u?.username ?? '?'}</p>
                        <p className="text-[11px] text-[var(--fg-mute)] font-mono">{u?.email}</p>
                      </td>
                      <td className="text-[12.5px]">{p?.name ?? '—'}</td>
                      <td className="text-[12.5px] tabular-nums">{g.discount_pct}%</td>
                      <td className="text-[12.5px] text-[var(--fg-dim)]">{g.approved_at ? relativeTime(g.approved_at) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {other.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--fg-mute)] mb-3">
            Rejected / Revoked · {other.length}
          </h2>
          <div className="card">
            <table className="table">
              <thead>
                <tr><th>Reseller</th><th>Product</th><th>Status</th><th>Reason</th><th>When</th></tr>
              </thead>
              <tbody>
                {other.map(g => {
                  const p = productMap.get(g.product_id)
                  const u = profileMap.get(g.reseller_id)
                  return (
                    <tr key={g.id} className="opacity-70">
                      <td className="text-[12.5px]">{u?.username ?? '?'}</td>
                      <td className="text-[12.5px]">{p?.name ?? '—'}</td>
                      <td><Pill tone="bad">{g.status}</Pill></td>
                      <td className="text-[12.5px] text-[var(--fg-dim)] truncate max-w-[280px]">{g.rejected_reason ?? '—'}</td>
                      <td className="text-[11.5px] text-[var(--fg-mute)]">{relativeTime(g.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function ApplicationCard({ g, product, profile }: { g: Grant; product?: Product; profile?: Profile }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-[14px] truncate">{g.custom_name ?? 'Untitled'}</p>
            <Pill tone="warn">pending</Pill>
          </div>
          <p className="text-[12px] text-[var(--fg-dim)]">
            <span className="font-mono">{profile?.username ?? '?'}</span> · {profile?.email}
          </p>
          <p className="text-[12px] text-[var(--fg-dim)] mt-0.5">
            wants to resell → <strong className="text-[var(--brand)]">{product?.name ?? 'unknown'}</strong>
          </p>
          <p className="text-[11px] text-[var(--fg-mute)] mt-1">submitted {relativeTime(g.created_at)}</p>
        </div>
        <GrantActions grantId={g.id} />
      </div>

      {g.pitch && (
        <div className="rounded-md p-3 mt-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
          <p className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider mb-1">Pitch</p>
          <p className="text-[12.5px] text-[var(--fg-dim)] whitespace-pre-wrap leading-relaxed">{g.pitch}</p>
        </div>
      )}

      {g.custom_image && (
        <p className="text-[11px] text-[var(--fg-mute)] mt-2">
          Image: <a href={g.custom_image} target="_blank" rel="noopener noreferrer" className="text-[var(--brand)] hover:underline font-mono">{g.custom_image.slice(0, 80)}</a>
        </p>
      )}
    </div>
  )
}
