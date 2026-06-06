import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Boxes, ArrowRight, Power } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { relativeTime } from '@/lib/utils'
import { CreateAppForm } from './CreateAppForm'

export const metadata = { title: 'Applications' }

interface Application {
  id:            string
  app_id:        string
  name:          string
  status:        string
  version:       string
  hwid_lock:     boolean
  total_users:   number
  online_users:  number
  created_at:    string
}

interface Profile { role: string }

export default async function ApplicationsPage() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  const { data: pRaw } = await supa
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'super_admin' && role !== 'reseller') {
    redirect('/dashboard?error=reseller_only')
  }

  const { data: appsRaw } = await supa
    .from('applications')
    .select('id, app_id, name, status, version, hwid_lock, total_users, online_users, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const apps = (appsRaw ?? []) as Application[]

  return (
    <div className="animate-in">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="label-mono mb-2">Auth Engine</p>
          <h1 className="text-[26px] font-bold tracking-tight">Applications</h1>
          <p className="text-[14px] text-[var(--fg-dim)] mt-1">
            Each application represents a tool you embed our auth system into. View setup instructions in <Link href="/dashboard/docs" className="text-[var(--brand)] hover:underline">Docs</Link>.
          </p>
        </div>
      </div>

      {/* Create form */}
      <div className="card mb-8">
        <div className="px-5 py-4 border-b border-[var(--hairline)]">
          <h2 className="font-semibold flex items-center gap-2"><Plus size={14} className="text-[var(--brand)]" /> New application</h2>
          <p className="text-[12px] text-[var(--fg-mute)] mt-0.5">You&apos;ll get an <code className="font-mono text-[var(--brand)]">app_id</code> and <code className="font-mono text-[var(--brand)]">app_secret</code>. The secret is shown <strong>once</strong> — save it.</p>
        </div>
        <div className="p-5">
          <CreateAppForm />
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="px-5 py-4 border-b border-[var(--hairline)]">
          <h2 className="font-semibold">Your applications</h2>
        </div>

        {apps.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Boxes size={32} className="mx-auto mb-3 text-[var(--fg-faint)]" />
            <p className="text-[14px] font-medium mb-1">No applications yet</p>
            <p className="text-[12.5px] text-[var(--fg-dim)]">Create your first one above to get auth credentials.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>App ID</th>
                <th>Status</th>
                <th>Users</th>
                <th>Online</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id}>
                  <td className="font-medium text-[var(--fg)]">{a.name}</td>
                  <td><code className="font-mono text-[12.5px] text-[var(--brand)]">{a.app_id}</code></td>
                  <td><Pill tone={a.status === 'active' ? 'ok' : 'warn'}>{a.status}</Pill></td>
                  <td className="tabular-nums">{a.total_users}</td>
                  <td className="tabular-nums flex items-center gap-1.5">
                    <Power size={10} className={a.online_users > 0 ? 'text-[var(--ok)]' : 'text-[var(--fg-mute)]'} />
                    {a.online_users}
                  </td>
                  <td className="text-[12px] text-[var(--fg-dim)]">{relativeTime(a.created_at)}</td>
                  <td className="text-right">
                    <Link
                      href={`/dashboard/applications/${a.id}`}
                      className="text-[12px] text-[var(--brand)] hover:underline inline-flex items-center gap-1"
                    >
                      Manage <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
