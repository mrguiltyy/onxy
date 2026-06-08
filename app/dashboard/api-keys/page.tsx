import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Key, BookOpen, ArrowRight } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { relativeTime } from '@/lib/utils'
import { CreateKeyForm, KeysList } from './KeysList'

export const metadata = { title: 'API Keys' }
export const dynamic = 'force-dynamic'

interface KeyRow {
  id:                 string
  key_prefix:         string
  name:               string
  scoped_product_ids: string[] | null
  active:             boolean
  last_used_at:       string | null
  request_count:      number
  created_at:         string
  expires_at:         string | null
}

interface Profile { role: string }

export default async function ApiKeysPage() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'reseller' && role !== 'super_admin') {
    redirect('/dashboard?error=reseller_only')
  }

  const { data: keysRaw } = await supa
    .from('seller_keys')
    .select('id, key_prefix, name, scoped_product_ids, active, last_used_at, request_count, created_at, expires_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const keys = (keysRaw as KeyRow[] | null) ?? []

  return (
    <div className="animate-in max-w-[960px]">
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label-mono mb-2">Developer</p>
          <h1 className="text-[26px] font-bold tracking-tight">API keys</h1>
          <p className="text-[14px] text-[var(--fg-dim)] mt-1 max-w-[520px]">
            Use these keys to generate license keys, manage HWIDs, and integrate OP into your own panel.
            Keep them secret — they have full access to your reseller account.
          </p>
        </div>
        <Link href="/dashboard/api-docs" className="btn btn-secondary btn-sm">
          <BookOpen size={12} /> API docs <ArrowRight size={11} />
        </Link>
      </div>

      {/* Create new key */}
      <div className="card p-5 mb-5">
        <p className="label-mono mb-3">Create a new key</p>
        <CreateKeyForm />
      </div>

      {/* Existing keys */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--hairline)' }}>
          <p className="font-semibold text-[13.5px]">Your keys</p>
          <p className="text-[11.5px] text-[var(--fg-mute)]">{keys.length} total</p>
        </div>
        {keys.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Key size={28} className="mx-auto mb-3 text-[var(--fg-faint)]" />
            <p className="text-[14px] mb-1">No API keys yet</p>
            <p className="text-[12.5px] text-[var(--fg-dim)]">Create your first key above to start using the API.</p>
          </div>
        ) : (
          <KeysList keys={keys.map(k => ({
            ...k,
            last_used_label: k.last_used_at ? relativeTime(k.last_used_at) : 'Never',
            created_label:   relativeTime(k.created_at),
          }))} />
        )}
      </div>

      {/* Help footer */}
      <div className="mt-6 card p-5 flex items-start gap-3" style={{ background: 'var(--brand-faint)', border: '1px solid rgba(59,130,246,0.20)' }}>
        <BookOpen size={14} className="text-[var(--brand)] mt-1 shrink-0" />
        <div>
          <p className="font-semibold text-[13px] mb-1">First time? Read the docs</p>
          <p className="text-[12px] text-[var(--fg-dim)] mb-2 leading-relaxed">
            Our API docs include copy-paste examples in 14 languages (TypeScript, Python, Go, C#, PHP, etc.) and a live
            request explorer where you can test endpoints against your real account.
          </p>
          <Link href="/dashboard/api-docs" className="text-[12px] text-[var(--brand)] hover:underline inline-flex items-center gap-1">
            Read the API docs <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}
