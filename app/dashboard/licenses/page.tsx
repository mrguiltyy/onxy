import Link from 'next/link'
import { Plus, KeyRound, Copy } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { relativeTime, formatDate } from '@/lib/utils'

interface License {
  id: string
  product: string
  key_prefix: string
  key_full: string
  status: string
  expires_at: string | null
  hwid: string | null
  ip: string | null
  last_seen: string | null
  created_at: string
}

export default async function LicensesPage() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('licenses')
    .select('id, product, key_prefix, key_full, status, expires_at, hwid, ip, last_seen, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const licenses = (data ?? []) as License[]

  const counts = {
    total:   licenses.length,
    active:  licenses.filter(l => l.status === 'active').length,
    expired: licenses.filter(l => l.status === 'expired').length,
    banned:  licenses.filter(l => l.status === 'banned').length,
  }

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold tracking-tight">License Keys</h1>
          <Pill tone="brand">{counts.total}/{counts.total} keys</Pill>
        </div>
        <Link href="/dashboard/generate" className="btn btn-primary btn-sm">
          <Plus size={14} /> Generate
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <FilterChip label={`${counts.total} Total`}     tone="brand" />
        <FilterChip label={`${counts.active} Active`}   tone="ok" />
        <FilterChip label={`${counts.expired} Expired`} tone="bad" />
        <FilterChip label={`${counts.banned} Banned`}   tone="warn" />
      </div>

      <div className="card overflow-hidden">
        {licenses.length === 0 ? (
          <div className="px-5 py-16 text-center max-w-[440px] mx-auto">
            <div className="w-12 h-12 mx-auto mb-4 rounded-md flex items-center justify-center"
              style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
              <KeyRound size={20} />
            </div>
            <p className="text-[15px] font-semibold mb-1">No license keys yet</p>
            <p className="text-[12.5px] text-[var(--fg-dim)] mb-5 leading-relaxed">
              You haven&apos;t bought or generated any keys. Browse the catalog to find a tool, or generate a key from your wallet.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link href="/products" className="btn btn-primary btn-sm">
                Browse products
              </Link>
              <Link href="/dashboard/generate" className="btn btn-secondary btn-sm">
                <Plus size={11} /> Generate key
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>License Key</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th>HWID</th>
                  <th>IP</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map(l => (
                  <tr key={l.id} className="cursor-pointer hover:bg-[var(--surface-2)]">
                    <td>
                      <Link href={`/dashboard/licenses/${l.id}`} className="flex items-center gap-2">
                        <code className="font-mono text-[12.5px] text-[var(--brand)]">
                          {l.key_prefix}-•••-•••
                        </code>
                      </Link>
                    </td>
                    <td className="text-[var(--fg)] font-medium">
                      <Link href={`/dashboard/licenses/${l.id}`}>{l.product}</Link>
                    </td>
                    <td><StatusPill status={l.status} /></td>
                    <td className="text-[12.5px]">
                      {l.expires_at ? formatDate(l.expires_at) : <span className="text-[var(--brand)]">Lifetime</span>}
                    </td>
                    <td className="font-mono text-[11.5px] text-[var(--fg-mute)]">
                      {l.hwid ? l.hwid.slice(0, 12) + '...' : '—'}
                    </td>
                    <td className="font-mono text-[11.5px] text-[var(--fg-mute)]">
                      {l.ip ?? '—'}
                    </td>
                    <td className="text-[12.5px]">
                      {l.last_seen ? relativeTime(l.last_seen) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterChip({ label, tone }: { label: string; tone: 'brand' | 'ok' | 'bad' | 'warn' | 'pend' }) {
  return <Pill tone={tone}>{label}</Pill>
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: 'ok' | 'bad' | 'warn' | 'pend'; label: string }> = {
    active:  { tone: 'ok',   label: 'Active'   },
    expired: { tone: 'bad',  label: 'Expired'  },
    banned:  { tone: 'warn', label: 'Banned'   },
    pending: { tone: 'pend', label: 'Pending'  },
  }
  const m = map[status] ?? { tone: 'pend' as const, label: status }
  return <Pill tone={m.tone}>{m.label}</Pill>
}
