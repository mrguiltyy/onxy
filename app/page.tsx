import Link from 'next/link'
import { ArrowRight, ShieldCheck, Cpu, Code2, Sparkles, Boxes, RefreshCw, Star, Check, Zap, Headphones, Activity, Lock } from 'lucide-react'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { Brand, BrandRow } from '@/components/Brand'
import { formatPrice, relativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface FeaturedProduct {
  id:             string
  slug:           string
  name:           string
  tagline:        string | null
  image_url:      string | null
  version:        string
  price_lifetime: number | null
  features:       string[]
  featured:       boolean
}

interface UpdateRow {
  product_id: string
  version:    string
  title:      string
  severity:   string
  created_at: string
}

interface IncidentRow { status: string }

export default async function HomePage() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  const signedIn = !!user

  const admin = supabaseAdmin()

  // Live stats — pulled fresh on every render
  const [{ count: usersCount }, { count: licsCount }, { count: activeLicsCount }] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('licenses').select('id', { count: 'exact', head: true }),
    admin.from('licenses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  // Featured products (up to 4)
  const { data: prodsRaw } = await admin
    .from('products')
    .select('id, slug, name, tagline, image_url, version, price_lifetime, features, featured')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(4)
  const featured = (prodsRaw as FeaturedProduct[] | null) ?? []

  // Latest 4 product updates as "activity"
  const { data: updsRaw } = await admin
    .from('product_updates')
    .select('product_id, version, title, severity, created_at')
    .order('created_at', { ascending: false })
    .limit(4)
  const updates = (updsRaw as UpdateRow[] | null) ?? []

  // Live status indicator
  const { data: incidents } = await admin
    .from('status_incidents')
    .select('status')
    .neq('status', 'resolved')
  const allOk = !incidents || (incidents as IncidentRow[]).length === 0

  // Build product name map for updates feed
  const updateProductMap = new Map<string, string>()
  if (updates.length) {
    const ids = [...new Set(updates.map(u => u.product_id))]
    const { data: namesRaw } = await admin.from('products').select('id, name').in('id', ids)
    for (const p of (namesRaw as { id: string; name: string }[] | null) ?? []) updateProductMap.set(p.id, p.name)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(10,13,20,0.80)',
          borderColor: 'var(--hairline)',
          backdropFilter: 'blur(14px) saturate(180%)',
        }}
      >
        <div className="container-x flex items-center justify-between py-3">
          <BrandRow />
          <nav className="hidden md:flex items-center gap-5">
            <Link href="/products" className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)]">Products</Link>
            <Link href="/status"   className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)]">Status</Link>
            <Link href="/faq"      className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)]">FAQ</Link>
            <Link href="/products" className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)]">For Resellers</Link>
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">Open dashboard <ArrowRight size={12} /></Link>
            ) : (
              <>
                <Link href="/login"    className="text-[13.5px] text-[var(--fg-dim)] hover:text-[var(--fg)]">Sign in</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Atmosphere */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 1100px 600px at 30% -10%, rgba(240,164,183,0.10), transparent 60%),' +
                'radial-gradient(ellipse 900px 600px at 80% 20%, rgba(162,200,238,0.10), transparent 65%)',
            }}
          />
          <div className="container-x relative pt-16 md:pt-24 pb-16">
            <Link
              href="/status"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11.5px] font-medium mb-8 transition-colors hover:text-[var(--fg)]"
              style={{
                background: allOk ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                borderColor: allOk ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.20)',
                color: allOk ? 'var(--ok)' : 'var(--bad)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{
                background: allOk ? 'var(--ok)' : 'var(--bad)',
                boxShadow: `0 0 8px ${allOk ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'}`,
              }} />
              {allOk ? 'All systems operational' : 'Active incident — see status'}
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
              {/* Left: pitch */}
              <div>
                <h1 className="text-[44px] md:text-[60px] font-bold tracking-tight leading-[1.02] mb-6" style={{ letterSpacing: '-0.035em' }}>
                  Private tools, sold &amp; resold,<br/>
                  <span style={{
                    background: 'var(--brand-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>without the panel mess.</span>
                </h1>

                <p className="text-[15.5px] text-[var(--fg-dim)] leading-relaxed max-w-[560px] mb-8">
                  OP is a marketplace and auth engine in one. Buy lifetime tools with HWID-bound keys.
                  Or get reseller access and white-label our catalog with your branding — at wholesale.
                  Auth, licensing, and updates handled for you.
                </p>

                <div className="flex items-center gap-3 flex-wrap mb-6">
                  <Link href="/products" className="btn btn-primary">
                    Browse products <ArrowRight size={13} />
                  </Link>
                  {!signedIn && (
                    <Link href="/register" className="btn btn-secondary">
                      Create free account
                    </Link>
                  )}
                </div>

                <p className="text-[11.5px] text-[var(--fg-mute)]">
                  Educational use only · Cancel anytime · No card required to browse
                </p>
              </div>

              {/* Right: stat tiles */}
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Users"       value={(usersCount ?? 0).toLocaleString()} icon={<ShieldCheck size={13} />} />
                <StatTile label="Licenses"    value={(licsCount ?? 0).toLocaleString()}  icon={<Lock size={13} />} />
                <StatTile label="Active keys" value={(activeLicsCount ?? 0).toLocaleString()} icon={<Activity size={13} />} accent="ok" />
                <StatTile label="Uptime"      value="99.9%" icon={<Zap size={13} />} accent="brand" />

                <div className="col-span-2 card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
                      <RefreshCw size={13} />
                    </span>
                    <p className="font-semibold text-[13px]">Latest releases</p>
                  </div>
                  <div className="space-y-1.5">
                    {updates.length === 0 ? (
                      <p className="text-[12px] text-[var(--fg-mute)]">No releases yet.</p>
                    ) : updates.map(u => (
                      <div key={u.product_id + u.version} className="flex items-center gap-2 text-[12px]">
                        <code className="font-mono text-[var(--brand)] shrink-0">v{u.version}</code>
                        <span className="text-[var(--fg-dim)] truncate flex-1">{updateProductMap.get(u.product_id) ?? '—'} · {u.title}</span>
                        <span className="text-[var(--fg-mute)] text-[10.5px] shrink-0">{relativeTime(u.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Featured products ──────────────────────────────── */}
        {featured.length > 0 && (
          <section className="py-16 border-t" style={{ borderColor: 'var(--hairline)' }}>
            <div className="container-x">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="label-mono mb-2">Catalog</p>
                  <h2 className="text-[28px] md:text-[34px] font-bold tracking-tight" style={{ letterSpacing: '-0.025em' }}>
                    Featured tools
                  </h2>
                </div>
                <Link href="/products" className="text-[13px] text-[var(--brand)] hover:underline inline-flex items-center gap-1">
                  View all <ArrowRight size={11} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {featured.map(p => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="card card-hover overflow-hidden flex flex-col group"
                  >
                    <div
                      className="h-28 relative"
                      style={{
                        background: p.image_url
                          ? `url(${p.image_url}) center/cover`
                          : 'linear-gradient(135deg, rgba(240,164,183,0.20), rgba(162,200,238,0.20))',
                        borderBottom: '1px solid var(--hairline)',
                      }}
                    >
                      {p.featured && (
                        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
                          <Star size={8} className="inline mr-1" /> Featured
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-[13.5px] truncate flex-1">{p.name}</p>
                        <span className="text-[9.5px] text-[var(--fg-mute)] font-mono">v{p.version}</span>
                      </div>
                      {p.tagline && <p className="text-[11.5px] text-[var(--fg-dim)] line-clamp-2 mb-3">{p.tagline}</p>}
                      <div className="mt-auto pt-2 flex items-end justify-between border-t" style={{ borderColor: 'var(--hairline)' }}>
                        {p.price_lifetime !== null && p.price_lifetime !== undefined ? (
                          <span className="text-[14px] font-bold tabular-nums">{formatPrice(p.price_lifetime)}</span>
                        ) : <span />}
                        <span className="text-[11px] text-[var(--brand)] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                          View <ArrowRight size={9} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── How it works ───────────────────────────────────── */}
        <section className="py-20 border-t" style={{ borderColor: 'var(--hairline)' }}>
          <div className="container-x">
            <div className="mb-10 max-w-[640px]">
              <p className="label-mono mb-2">How it works</p>
              <h2 className="text-[28px] md:text-[34px] font-bold tracking-tight mb-3" style={{ letterSpacing: '-0.025em' }}>
                From signup to running tool in 60 seconds.
              </h2>
              <p className="text-[14.5px] text-[var(--fg-dim)] leading-relaxed">
                We handle auth, HWID binding, license validation, updates, and customer support automation.
                You focus on the tool.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Step n="01" title="Sign up" body="Free account in 30 seconds. Email or Discord — no credit card to browse the catalog." />
              <Step n="02" title="Buy or generate a key" body="Pick a tool, pick a tier (1 day to lifetime), pay. Your key is delivered instantly and shown in your dashboard." />
              <Step n="03" title="Run the tool" body="First launch binds the key to your hardware. Auto-update, lifetime support, self-serve HWID resets if you swap PCs." />
            </div>
          </div>
        </section>

        {/* ── For resellers ──────────────────────────────────── */}
        <section className="py-20 border-t relative overflow-hidden" style={{ borderColor: 'var(--hairline)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 800px 400px at 80% 50%, rgba(240,164,183,0.08), transparent 60%)',
          }} />
          <div className="container-x relative">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-center">
              <div>
                <p className="label-mono mb-3">For resellers</p>
                <h2 className="text-[28px] md:text-[34px] font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.025em' }}>
                  White-label our catalog.
                  Or run your own auth.
                </h2>
                <p className="text-[14.5px] text-[var(--fg-dim)] leading-relaxed mb-6 max-w-[520px]">
                  Two reseller paths. Pick either or both — they stack.
                </p>

                <div className="space-y-3 mb-7">
                  <BenefitRow icon={<Boxes size={13} />} title="Resell our tools" body="Apply to white-label any product. Pay wholesale, set your own branding, get notified instantly when we ship an update." />
                  <BenefitRow icon={<Code2 size={13} />} title="Auth for your tools" body="Drop-in SDK for C# · C++ · Python · Node · Java · VB.NET. HWID + heartbeat + bans, in 10 lines of code." />
                  <BenefitRow icon={<Headphones size={13} />} title="Lifetime support for buyers" body="Customers who buy lifetime get priority support — auto-flagged in our queue." />
                </div>

                <div className="flex gap-3">
                  <Link href="/products" className="btn btn-primary">
                    Browse to resell <ArrowRight size={13} />
                  </Link>
                  <Link href={signedIn ? '/dashboard/docs' : '/register?intent=reseller'} className="btn btn-secondary">
                    See auth docs
                  </Link>
                </div>
              </div>

              {/* Mock code panel */}
              <div className="card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[var(--hairline)] flex items-center gap-2 text-[11px] font-mono text-[var(--fg-mute)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--bad)]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--warn)]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--ok)]" />
                  <span className="ml-2">OPAuth.cs · 10 lines</span>
                </div>
                <pre className="p-4 text-[11.5px] leading-[1.7] overflow-x-auto" style={{
                  background: 'var(--surface-2)',
                  fontFamily: 'ui-monospace, SF Mono, Menlo, Consolas, monospace',
                }}>
<code>{`var auth = new OPAuth(
    appId:     "op_a8f...",
    appSecret: "ops_xxx...",
    version:   "1.0.0"
);

var result = await auth.LoginAsync(keyFromUser);
if (!result.Success) return Shutdown(result.Message);

auth.StartHeartbeat(TimeSpan.FromSeconds(60),
    onInvalidated: () => Application.Exit());
`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why OP ─────────────────────────────────────────── */}
        <section className="py-20 border-t" style={{ borderColor: 'var(--hairline)' }}>
          <div className="container-x">
            <p className="label-mono mb-2">Why OP</p>
            <h2 className="text-[28px] md:text-[34px] font-bold tracking-tight mb-10 max-w-[640px]" style={{ letterSpacing: '-0.025em' }}>
              Built for tools that need to ship, scale, and stay alive.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Feature icon={<Cpu size={14} />} title="HWID-bound" body="Every license is locked to one machine on first login. Constant-time HWID compare. Self-serve resets when you swap hardware." />
              <Feature icon={<Zap size={14} />} title="Brute-force-proof" body="Per-IP + per-app sliding window throttle. 10 fails / minute triggers a 5-minute block. No tickets needed." />
              <Feature icon={<Activity size={14} />} title="Live heartbeat" body="Tool calls /heartbeat every 60s. We can kick banned users instantly — no waiting for re-login." />
              <Feature icon={<Sparkles size={14} />} title="Self-serve support" body="Troubleshooter wizard fixes 80% of issues — HWID resets, invalid keys, rate limits — without opening a ticket." />
              <Feature icon={<RefreshCw size={14} />} title="Auto-update notifications" body="Publish a release → every approved reseller of that product gets a notification instantly." />
              <Feature icon={<ShieldCheck size={14} />} title="App secrets hashed" body="Secrets are SHA-256 hashed in the database. Even our admins can't recover them. Rotate any time from your dashboard." />
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────── */}
        <section className="py-20 border-t" style={{ borderColor: 'var(--hairline)' }}>
          <div className="container-x">
            <div className="card overflow-hidden text-center" style={{
              padding: '64px 24px',
              background: 'linear-gradient(135deg, rgba(240,164,183,0.06), rgba(162,200,238,0.06))',
            }}>
              <Brand size="md" className="mx-auto mb-6 flex justify-center" />
              <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-3" style={{ letterSpacing: '-0.025em' }}>
                {signedIn ? 'Pick up where you left off.' : 'Get started in 30 seconds.'}
              </h2>
              <p className="text-[14.5px] text-[var(--fg-dim)] mb-7 max-w-[480px] mx-auto leading-relaxed">
                {signedIn
                  ? 'Your dashboard, licenses, and resells are waiting.'
                  : 'Free account. Browse the catalog, generate test keys, and try the auth engine — no card required to get started.'}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {signedIn ? (
                  <Link href="/dashboard" className="btn btn-primary">Open dashboard <ArrowRight size={13} /></Link>
                ) : (
                  <>
                    <Link href="/register" className="btn btn-primary">Create account <ArrowRight size={13} /></Link>
                    <Link href="/products"  className="btn btn-secondary">Browse first</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t" style={{ borderColor: 'var(--hairline)' }}>
        <div className="container-x">
          <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
            <div>
              <BrandRow />
              <p className="text-[12px] text-[var(--fg-mute)] mt-2 max-w-[280px]">
                Marketplace + auth engine for private tools. Educational use only.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-x-10 gap-y-1.5">
              <FooterCol title="Platform" links={[
                { href: '/products', label: 'Products' },
                { href: '/status',   label: 'Status' },
                { href: signedIn ? '/dashboard/docs' : '/register', label: 'Docs' },
              ]} />
              <FooterCol title="Support" links={[
                { href: '/faq',                       label: 'FAQ' },
                { href: signedIn ? '/dashboard/troubleshoot' : '/login', label: 'Troubleshoot' },
                { href: signedIn ? '/dashboard/tickets'     : '/login', label: 'Tickets' },
              ]} />
              <FooterCol title="Legal" links={[
                { href: '/terms',   label: 'Terms' },
                { href: '/privacy', label: 'Privacy' },
              ]} />
            </div>
          </div>
          <div className="border-t pt-4 flex items-center justify-between text-[11px] text-[var(--fg-mute)] flex-wrap gap-2" style={{ borderColor: 'var(--hairline)' }}>
            <p>© {new Date().getFullYear()} OP. All rights reserved.</p>
            <p>Educational use only · Buyer assumes all responsibility for tool usage</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
function StatTile({ label, value, icon, accent = 'brand' }: { label: string; value: string; icon: React.ReactNode; accent?: 'brand' | 'ok' }) {
  const c = accent === 'ok'
    ? { bg: 'rgba(34,197,94,0.08)', fg: 'var(--ok)' }
    : { bg: 'var(--brand-faint)',   fg: 'var(--brand)' }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: c.bg, color: c.fg }}>{icon}</span>
        <span className="text-[10px] text-[var(--fg-mute)] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[22px] font-bold tabular-nums" style={{ letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card p-6">
      <p className="label-mono mb-3">{n}</p>
      <h3 className="font-semibold text-[16px] mb-2">{title}</h3>
      <p className="text-[13px] text-[var(--fg-dim)] leading-relaxed">{body}</p>
    </div>
  )
}

function BenefitRow({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
        {icon}
      </span>
      <div>
        <p className="font-semibold text-[13.5px] mb-0.5">{title}</p>
        <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-5">
      <span className="w-8 h-8 rounded-md flex items-center justify-center mb-3"
        style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
        {icon}
      </span>
      <h3 className="font-semibold text-[14px] mb-1">{title}</h3>
      <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed">{body}</p>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="font-semibold text-[12px] uppercase tracking-wider text-[var(--fg-mute)] mb-2">{title}</p>
      {links.map(l => (
        <Link key={l.href + l.label} href={l.href} className="block text-[12.5px] text-[var(--fg-dim)] hover:text-[var(--fg)] py-0.5">
          {l.label}
        </Link>
      ))}
    </div>
  )
}
