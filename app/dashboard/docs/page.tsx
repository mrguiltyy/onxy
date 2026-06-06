import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Boxes, KeyRound, Activity, Code2 } from 'lucide-react'
import { supabaseServer } from '@/lib/supabase/server'
import { LanguageTabs } from './LanguageTabs'

export const metadata = { title: 'Docs · Auth Engine' }
export const dynamic = 'force-dynamic'

interface Profile { role: string }
interface AppRow { app_id: string; name: string }

export default async function DocsPage({ searchParams }: { searchParams: Promise<{ app?: string }> }) {
  const params = await searchParams
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'super_admin' && role !== 'reseller') {
    redirect('/dashboard?error=reseller_only')
  }

  const { data: appsRaw } = await supa
    .from('applications').select('app_id, name').eq('owner_id', user.id).order('created_at', { ascending: false })
  const apps = (appsRaw ?? []) as AppRow[]

  const selectedAppId = params.app ?? apps[0]?.app_id ?? 'YOUR_APP_ID'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onxy.cc'

  return (
    <div className="animate-in max-w-[960px]">
      <div className="mb-8">
        <p className="label-mono mb-2">Auth Engine</p>
        <h1 className="text-[26px] font-bold tracking-tight">Integration docs</h1>
        <p className="text-[14px] text-[var(--fg-dim)] mt-1">
          Embed our license authentication into your tool. We provide drop-in SDKs for <strong className="text-[var(--fg)]">C#, C++, Python, Node.js, Java, VB.NET</strong>, plus raw REST for everything else (Go, Rust, PHP, Lua…).
        </p>
      </div>

      {/* App picker */}
      {apps.length > 0 && (
        <div className="card p-4 mb-8 flex items-center gap-3 flex-wrap">
          <Boxes size={14} className="text-[var(--brand)]" />
          <span className="text-[12.5px] text-[var(--fg-dim)]">Examples pre-filled for:</span>
          {apps.map(a => (
            <Link
              key={a.app_id}
              href={`/dashboard/docs?app=${a.app_id}`}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium border transition-colors ${
                a.app_id === selectedAppId
                  ? 'text-[var(--brand)]'
                  : 'text-[var(--fg-dim)] hover:text-[var(--fg)]'
              }`}
              style={a.app_id === selectedAppId
                ? { background: 'var(--brand-faint)', borderColor: 'rgba(59,130,246,0.30)' }
                : { borderColor: 'var(--hairline)' }}
            >
              {a.name}
            </Link>
          ))}
        </div>
      )}

      {/* Overview */}
      <Section title="How it works" icon={<BookOpen size={14} />}>
        <p>The auth engine is a stateless REST API. Whatever language your tool is in, it makes 3 calls:</p>
        <ol className="list-decimal pl-5 space-y-1.5 mt-2 text-[13px] text-[var(--fg-dim)]">
          <li><code className="font-mono text-[var(--brand)]">/v1/auth/login</code> — exchange license key + HWID for a session token.</li>
          <li><code className="font-mono text-[var(--brand)]">/v1/auth/check</code> — one-shot validate after login.</li>
          <li><code className="font-mono text-[var(--brand)]">/v1/auth/heartbeat</code> — call every 60–120s to keep the session alive and detect bans / kicks.</li>
        </ol>
        <p className="mt-3">
          All payloads are JSON. Authentication is your <strong>app_secret</strong> (login only) + per-request HWID match.
          HWID is computed from CPU ProcessorId + Motherboard SerialNumber, hashed SHA-256 — the same bytes regardless of language.
        </p>
      </Section>

      {/* Language-picked SDK */}
      <Section title="Pick your language" icon={<Code2 size={14} />}>
        <p className="mb-4 text-[13.5px]">Each SDK is a single drop-in file. Save it, fill in your <code className="font-mono text-[var(--brand)]">app_id</code> + <code className="font-mono text-[var(--brand)]">app_secret</code>, call <code className="font-mono">.login()</code>, then start the heartbeat.</p>
        <LanguageTabs selectedAppId={selectedAppId} baseUrl={baseUrl} />
      </Section>

      {/* Error codes */}
      <Section title="Error codes" icon={<Activity size={14} />}>
        <p className="mb-3 text-[13px]">All failures return JSON with a <code className="font-mono text-[var(--brand)]">code</code> field. Show <code className="font-mono text-[var(--brand)]">message</code> to your users; switch on <code className="font-mono text-[var(--brand)]">code</code> to take action.</p>
        <table className="table">
          <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
          <tbody>
            {[
              ['invalid_app',       'app_id or app_secret is wrong'],
              ['app_paused',        'Reseller paused the application'],
              ['app_frozen',        'Emergency freeze active — all users locked out'],
              ['version_mismatch',  'Strict version check enabled, sent a different version'],
              ['invalid_key',       'License key not found'],
              ['key_wrong_app',     'License key belongs to a different application'],
              ['key_banned',        'License is banned'],
              ['key_expired',       'License has expired'],
              ['hwid_mismatch',     'HWID does not match the one bound to this license'],
              ['invalid_session',   'Session token is missing, expired, or revoked'],
              ['rate_limited',      'Too many failed attempts from this IP — wait 5 minutes'],
              ['bad_request',       'Request body malformed'],
            ].map(([code, meaning]) => (
              <tr key={code}>
                <td><code className="font-mono text-[12px] text-[var(--brand)]">{code}</code></td>
                <td className="text-[13px] text-[var(--fg-dim)]">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Security note */}
      <Section title="Security notes" icon={<KeyRound size={14} />}>
        <ul className="list-disc pl-5 space-y-2 text-[13.5px]">
          <li>
            <strong className="text-[var(--fg)]">Protect your app_secret.</strong> It&apos;s only sent to <code className="font-mono">/login</code>.
            Once you have a session token, drop the secret. For compiled binaries (C#, C++, VB.NET) obfuscate the constant with ConfuserEx / Eazfuscator / VMProtect.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Client-side auth is always bypassable.</strong> A determined attacker can patch your binary or proxy your HTTPS.
            Treat HWID + heartbeat as defense in depth. For high-value features, also gate them behind server-side checks (call our API before unlocking critical UI).
          </li>
          <li>
            <strong className="text-[var(--fg)]">HWID changes on hardware swaps.</strong> Users who upgrade their motherboard will need an HWID reset.
            You can clear it from the <Link href="/dashboard/applications" className="text-[var(--brand)] hover:underline">application page</Link>.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Rate limiting:</strong> 10 failed attempts per IP per app per minute triggers a 5-minute block.
            Plan your UX to surface clear &quot;invalid key&quot; errors so users don&apos;t spam-retry.
          </li>
        </ul>
      </Section>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-[18px] font-semibold mb-3 flex items-center gap-2">
        <span className="text-[var(--brand)]">{icon}</span> {title}
      </h2>
      <div className="text-[13.5px] text-[var(--fg-dim)] leading-relaxed">
        {children}
      </div>
    </section>
  )
}
