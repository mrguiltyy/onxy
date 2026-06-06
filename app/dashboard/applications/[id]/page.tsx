import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Power, RotateCw, Trash2, KeyRound, Activity, BookOpen } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { relativeTime } from '@/lib/utils'
import { ToggleStatusButton, RotateSecretButton, DeleteAppButton } from './controls'

export const dynamic = 'force-dynamic'

interface Application {
  id:            string
  app_id:        string
  name:          string
  description:   string | null
  status:        string
  version:       string
  hwid_lock:     boolean
  version_check: boolean
  freeze_users:  boolean
  total_users:   number
  online_users:  number
  created_at:    string
}

interface LicenseRow {
  id:           string
  key_prefix:   string
  status:       string
  banned:       boolean
  hwid:         string | null
  last_login_at: string | null
  login_count:  number
  expires_at:   string | null
  created_at:   string
}

interface AuthLogRow {
  id:         string
  event_type: string
  code:       string | null
  ip:         string | null
  hwid:       string | null
  created_at: string
}

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  const { data: aRaw } = await supa
    .from('applications')
    .select('id, app_id, name, description, status, version, hwid_lock, version_check, freeze_users, total_users, online_users, created_at')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle()

  const app = aRaw as Application | null
  if (!app) notFound()

  const { data: licsRaw } = await supa
    .from('licenses')
    .select('id, key_prefix, status, banned, hwid, last_login_at, login_count, expires_at, created_at')
    .eq('app_id', app.id)
    .order('created_at', { ascending: false })
    .limit(50)
  const lics = (licsRaw ?? []) as LicenseRow[]

  const { data: logsRaw } = await supa
    .from('auth_logs')
    .select('id, event_type, code, ip, hwid, created_at')
    .eq('app_id', app.id)
    .order('created_at', { ascending: false })
    .limit(25)
  const logs = (logsRaw ?? []) as AuthLogRow[]

  return (
    <div className="animate-in">
      <Link href="/dashboard/applications" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 mb-4">
        <ChevronLeft size={13} /> All applications
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[26px] font-bold tracking-tight">{app.name}</h1>
            <Pill tone={app.status === 'active' ? 'ok' : 'warn'}>{app.status}</Pill>
            {app.freeze_users && <Pill tone="bad">frozen</Pill>}
          </div>
          {app.description && <p className="text-[13.5px] text-[var(--fg-dim)]">{app.description}</p>}
          <p className="text-[11.5px] text-[var(--fg-mute)] mt-2 font-mono">
            app_id: <span className="text-[var(--brand)]">{app.app_id}</span> &nbsp;·&nbsp; version {app.version} &nbsp;·&nbsp; created {relativeTime(app.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/docs?app=${app.app_id}`} className="btn btn-secondary btn-sm">
            <BookOpen size={13} /> Docs
          </Link>
          <ToggleStatusButton appId={app.id} status={app.status as 'active' | 'paused'} />
          <RotateSecretButton appId={app.id} />
          <DeleteAppButton appId={app.id} name={app.name} />
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Total users"   value={app.total_users.toString()} icon={<KeyRound size={14} />} />
        <Stat label="Online now"    value={app.online_users.toString()} icon={<Power size={14} />} accent="ok" />
        <Stat label="HWID lock"     value={app.hwid_lock ? 'on' : 'off'} icon={<RotateCw size={14} />} />
        <Stat label="Version check" value={app.version_check ? 'strict' : 'open'} icon={<Activity size={14} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Licenses */}
        <div className="card lg:col-span-2">
          <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center justify-between">
            <h2 className="font-semibold">Licenses</h2>
            <Link href="/dashboard/generate" className="text-[12px] text-[var(--brand)] hover:underline">Generate →</Link>
          </div>
          {lics.length === 0 ? (
            <p className="px-5 py-10 text-center text-[12.5px] text-[var(--fg-mute)]">No licenses assigned to this application yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Status</th>
                  <th>HWID</th>
                  <th>Logins</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {lics.map(l => (
                  <tr key={l.id}>
                    <td><code className="font-mono text-[12px] text-[var(--brand)]">{l.key_prefix}-•••</code></td>
                    <td><Pill tone={l.banned ? 'bad' : l.status === 'active' ? 'ok' : 'pend'}>{l.banned ? 'banned' : l.status}</Pill></td>
                    <td className="font-mono text-[11.5px] text-[var(--fg-dim)]">{l.hwid ? l.hwid.slice(0, 10) + '…' : '—'}</td>
                    <td className="tabular-nums">{l.login_count ?? 0}</td>
                    <td className="text-[12px] text-[var(--fg-dim)]">{l.last_login_at ? relativeTime(l.last_login_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Auth log */}
        <div className="card">
          <div className="px-5 py-4 border-b border-[var(--hairline)]">
            <h2 className="font-semibold flex items-center gap-2"><Activity size={13} className="text-[var(--brand)]" /> Recent auth events</h2>
          </div>
          <div className="px-2 py-2 max-h-[420px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="px-3 py-8 text-center text-[12px] text-[var(--fg-mute)]">No events yet.</p>
            ) : (
              logs.map(l => (
                <div key={l.id} className="px-3 py-2.5 hover:bg-[var(--surface-2)] rounded-md transition-colors">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${l.event_type.includes('fail') || l.event_type.includes('mismatch') || l.event_type.includes('banned') ? 'text-[var(--bad)]' : l.event_type.includes('success') ? 'text-[var(--ok)]' : 'text-[var(--fg-dim)]'}`}>
                      {l.event_type}
                    </span>
                    {l.code && <span className="text-[10.5px] text-[var(--fg-mute)] font-mono">{l.code}</span>}
                  </div>
                  <p className="text-[11px] text-[var(--fg-dim)] font-mono truncate">{l.ip ?? '—'} · {l.hwid?.slice(0, 8) ?? '—'}…</p>
                  <p className="text-[10.5px] text-[var(--fg-mute)]">{relativeTime(l.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, icon, accent = 'brand' }: { label: string; value: string; icon: React.ReactNode; accent?: 'brand' | 'ok' }) {
  const c = accent === 'ok' ? { bg: 'rgba(34,197,94,0.10)', fg: 'var(--ok)' } : { bg: 'var(--brand-faint)', fg: 'var(--brand)' }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: c.bg, color: c.fg }}>{icon}</span>
      </div>
      <p className="text-[22px] font-bold tabular-nums" style={{ letterSpacing: '-0.02em' }}>{value}</p>
      <p className="text-[11px] text-[var(--fg-mute)] uppercase tracking-wider mt-1">{label}</p>
    </div>
  )
}
