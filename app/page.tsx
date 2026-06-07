import Link from 'next/link'
import { ArrowRight, Cpu, Zap, Activity, RefreshCw, Lock, Star, Check, Crown, Store, User as UserIcon, Sparkles } from 'lucide-react'
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

export default async function HomePage() {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  const signedIn = !!user
  const admin = supabaseAdmin()

  const { data: prodsRaw } = await admin
    .from('products')
    .select('id, slug, name, tagline, image_url, version, price_lifetime, features, featured')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(3)
  const featured = (prodsRaw as FeaturedProduct[] | null) ?? []

  const { data: updsRaw } = await admin
    .from('product_updates')
    .select('product_id, version, title, severity, created_at')
    .order('created_at', { ascending: false })
    .limit(3)
  const updates = (updsRaw as UpdateRow[] | null) ?? []

  const updateProductMap = new Map<string, string>()
  if (updates.length) {
    const ids = [...new Set(updates.map(u => u.product_id))]
    const { data: namesRaw } = await admin.from('products').select('id, name').in('id', ids)
    for (const p of (namesRaw as { id: string; name: string }[] | null) ?? []) updateProductMap.set(p.id, p.name)
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(10,13,20,0.78)',
          borderColor: 'var(--hairline)',
          backdropFilter: 'blur(16px) saturate(180%)',
        }}
      >
        <div className="container-x flex items-center justify-between py-3.5">
          <BrandRow />
          <nav className="hidden md:flex items-center gap-7">
            <Link href="/products" className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Products</Link>
            <Link href="/reseller" className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Reseller</Link>
            <Link href="/blog"     className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Blog</Link>
            <Link href="/faq"      className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">FAQ</Link>
            <Link href="/status"   className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">Status</Link>
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard <ArrowRight size={12} /></Link>
            ) : (
              <>
                <Link href="/login"    className="text-[13px] text-[var(--fg-dim)] hover:text-[var(--fg)] px-2">Sign in</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ─── HERO ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 900px 500px at 25% 10%, rgba(240,164,183,0.10), transparent 60%),' +
                'radial-gradient(ellipse 700px 500px at 80% 60%, rgba(162,200,238,0.10), transparent 65%)',
            }}
          />
          <div className="container-x relative pt-24 md:pt-32 pb-28">
            <div className="max-w-[820px]">
              <h1
                className="text-[48px] md:text-[64px] font-bold tracking-tight leading-[1.02] mb-7"
                style={{ letterSpacing: '-0.035em' }}
              >
                Private tools, sold the way they{' '}
                <span
                  style={{
                    background: 'var(--brand-gradient)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >should be.</span>
              </h1>

              <p className="text-[16px] md:text-[17px] text-[var(--fg-dim)] leading-relaxed mb-9 max-w-[620px]">
                OP is a marketplace and license engine in one. Buy lifetime tools with HWID-bound keys.
                Become a reseller and white-label our catalog. Or embed our auth API in your own apps —
                seven SDKs, ten lines of code.
              </p>

              <div className="flex items-center gap-3 flex-wrap mb-5">
                <Link href="/products" className="btn btn-primary">
                  Browse products <ArrowRight size={14} />
                </Link>
                {!signedIn && (
                  <Link href="/register" className="btn btn-secondary">
                    Create free account
                  </Link>
                )}
                {signedIn && (
                  <Link href="/dashboard" className="btn btn-secondary">
                    Open dashboard
                  </Link>
                )}
              </div>

              <p className="text-[12px] text-[var(--fg-mute)]">
                Educational use only · No card needed to browse · Cancel anytime
              </p>
            </div>
          </div>
        </section>


        {/* ─── THREE TIERS ────────────────────────────────────────── */}
        <Section
          eyebrow="Three ways to use OP"
          title="Buy a tool, resell our catalog, or run your own panel."
          description="Pick the tier that matches where you are. Upgrade anytime — everything stacks."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <TierCard
              icon={<UserIcon size={16} />}
              tier="Customer"
              price="Free to start"
              tagline="Buy a key, run the tool."
              features={[
                'Browse the catalog free',
                'Lifetime or subscription keys',
                'HWID locked, self-serve resets',
                'In-app diagnostics & troubleshooter',
              ]}
              cta="Browse products"
              ctaHref="/products"
            />
            <TierCard
              icon={<Store size={16} />}
              tier="Reseller"
              price="from $14.99/mo"
              tagline="Sell our tools with your branding."
              features={[
                'Wholesale pricing per key',
                'White-label any product',
                'Use auth engine for your own apps',
                'Update notifications via Discord',
              ]}
              cta="See reseller plans"
              ctaHref="/reseller"
              featured
            />
            <TierCard
              icon={<Crown size={16} />}
              tier="Rebrand"
              price="Contact us"
              tagline="Run your own mini-OP."
              features={[
                'Your own subdomain',
                'Your own users + products',
                'Your own admin panel',
                'Branded end-to-end',
              ]}
              cta="Coming soon"
              ctaHref="/blog/welcome-to-op"
            />
          </div>
        </Section>


        {/* ─── FEATURED PRODUCTS ──────────────────────────────────── */}
        {featured.length > 0 && (
          <Section
            eyebrow="Catalog"
            title="Featured tools"
            description="A sample of what's live. Every tool ships with our auth engine baked in."
            link={{ label: 'View all products', href: '/products' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featured.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </Section>
        )}


        {/* ─── HOW IT WORKS ───────────────────────────────────────── */}
        <Section
          eyebrow="How it works"
          title="From signup to running tool in 60 seconds."
          description="No salespeople. No demos. Just click and go."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Step n="01" title="Sign up"
              body="Email or Discord. Free, 30 seconds. Linking Discord adds $1 to your wallet automatically." />
            <Step n="02" title="Pick a tier"
              body="Buy a key, generate as a reseller at wholesale, or embed our auth in your own tool." />
            <Step n="03" title="Ship"
              body="Keys are delivered instantly. The tool checks HWID + heartbeat for as long as it runs." />
          </div>
        </Section>


        {/* ─── WHY OP ─────────────────────────────────────────────── */}
        <Section
          eyebrow="Why OP"
          title="Built for tools that need to ship, scale, and stay alive."
          description=""
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Feature icon={<Cpu size={14} />}         title="HWID-bound"            body="Every license locks to one machine on first login. Constant-time HWID compare, 3 self-serve resets." />
            <Feature icon={<Zap size={14} />}         title="Brute-force-proof"     body="Per-IP + per-app sliding-window throttle. 10 fails / minute → 5-minute block." />
            <Feature icon={<Activity size={14} />}    title="Live heartbeat"        body="Tool calls /heartbeat every 60s. Banned users get kicked instantly — no waiting." />
            <Feature icon={<Sparkles size={14} />}    title="Self-serve support"    body="Auto-troubleshooter fixes 80% of issues without opening a ticket." />
            <Feature icon={<RefreshCw size={14} />}   title="Auto-update fan-out"   body="Publish a release → every approved reseller of that product gets notified instantly." />
            <Feature icon={<Lock size={14} />}        title="App secrets hashed"    body="SHA-256 in the DB. Even our admins can't recover them — only rotate them." />
          </div>
        </Section>


        {/* ─── LATEST UPDATES ─────────────────────────────────────── */}
        {updates.length > 0 && (
          <Section
            eyebrow="What's shipped recently"
            title="Recent releases"
            description="We ship constantly. Resellers get notified the second a release lands."
            link={{ label: 'See blog', href: '/blog' }}
          >
            <div className="card divide-y" style={{ borderColor: 'var(--hairline)' }}>
              {updates.map(u => (
                <div key={u.product_id + u.version} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="font-mono text-[12px] text-[var(--brand)] shrink-0">v{u.version}</code>
                    <p className="text-[13.5px] truncate">
                      <strong>{updateProductMap.get(u.product_id) ?? '—'}</strong>
                      <span className="text-[var(--fg-dim)] mx-1.5">·</span>
                      <span className="text-[var(--fg-dim)]">{u.title}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-[var(--fg-mute)] shrink-0">{relativeTime(u.created_at)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}


        {/* ─── FINAL CTA ─────────────────────────────────────────── */}
        <section className="py-24 border-t" style={{ borderColor: 'var(--hairline)' }}>
          <div className="container-x">
            <div
              className="rounded-2xl py-16 px-6 text-center max-w-[760px] mx-auto"
              style={{
                background:
                  'radial-gradient(ellipse 800px 400px at center 0%, rgba(240,164,183,0.08), transparent 60%),' +
                  'var(--surface)',
                border: '1px solid var(--hairline)',
              }}
            >
              <Brand size="md" href={undefined} className="mx-auto mb-6 flex justify-center" />
              <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-3" style={{ letterSpacing: '-0.025em' }}>
                {signedIn ? 'Welcome back.' : 'Ready in 30 seconds.'}
              </h2>
              <p className="text-[14.5px] text-[var(--fg-dim)] mb-7 max-w-[440px] mx-auto leading-relaxed">
                {signedIn
                  ? 'Your dashboard, licenses, and resells are waiting.'
                  : 'Free to start. Browse the catalog, link Discord for $1, try the SDK — no card required.'}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {signedIn ? (
                  <Link href="/dashboard" className="btn btn-primary">Open dashboard <ArrowRight size={13} /></Link>
                ) : (
                  <>
                    <Link href="/register" className="btn btn-primary">Create account <ArrowRight size={13} /></Link>
                    <Link href="/products"  className="btn btn-secondary">Browse products</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className="py-12 border-t" style={{ borderColor: 'var(--hairline)' }}>
        <div className="container-x">
          <div className="flex items-start justify-between flex-wrap gap-8 mb-8">
            <div className="max-w-[280px]">
              <BrandRow />
              <p className="text-[12.5px] text-[var(--fg-mute)] mt-3 leading-relaxed">
                Marketplace + auth engine for private tools. Educational use only.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-x-12 gap-y-1.5 text-[12.5px]">
              <FooterCol title="Platform" items={[
                ['Products', '/products'],
                ['Reseller', '/reseller'],
                ['Status',   '/status'],
                ['Docs',     signedIn ? '/dashboard/docs' : '/register'],
              ]} />
              <FooterCol title="Resources" items={[
                ['Blog', '/blog'],
                ['FAQ',  '/faq'],
                ['Sign in', '/login'],
                ['Get started', '/register'],
              ]} />
              <FooterCol title="Legal" items={[
                ['Terms',   '/terms'],
                ['Privacy', '/privacy'],
              ]} />
            </div>
          </div>

          <div className="pt-6 border-t flex items-center justify-between flex-wrap gap-3 text-[11px] text-[var(--fg-mute)]"
            style={{ borderColor: 'var(--hairline)' }}>
            <p>© {new Date().getFullYear()} OP · All rights reserved</p>
            <p>Educational use only · Buyer assumes all responsibility</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


/* ──────────────────────────────────────────────────────────────────
   Reusable Section wrapper — same eyebrow / title / description / link
   pattern for EVERY major section so the page reads as one piece.
   ────────────────────────────────────────────────────────────────── */
function Section({ eyebrow, title, description, link, children }: {
  eyebrow:     string
  title:       string
  description: string
  link?:       { label: string; href: string }
  children:    React.ReactNode
}) {
  return (
    <section className="py-28 md:py-32 border-t" style={{ borderColor: 'var(--hairline)' }}>
      <div className="container-x">
        <header className="flex items-end justify-between gap-6 mb-12 flex-wrap">
          <div className="max-w-[640px]">
            <p className="label-mono mb-3">{eyebrow}</p>
            <h2 className="text-[28px] md:text-[34px] font-bold tracking-tight mb-3" style={{ letterSpacing: '-0.025em' }}>
              {title}
            </h2>
            {description && <p className="text-[14.5px] text-[var(--fg-dim)] leading-relaxed">{description}</p>}
          </div>
          {link && (
            <Link href={link.href} className="text-[13px] text-[var(--brand)] hover:underline inline-flex items-center gap-1 shrink-0">
              {link.label} <ArrowRight size={11} />
            </Link>
          )}
        </header>
        {children}
      </div>
    </section>
  )
}


/* ─── Sub-components ─────────────────────────────────────────────── */
function TierCard({ icon, tier, price, tagline, features, cta, ctaHref, featured }: {
  icon: React.ReactNode; tier: string; price: string; tagline: string; features: string[]; cta: string; ctaHref: string; featured?: boolean;
}) {
  return (
    <div
      className="card p-6 flex flex-col relative overflow-hidden"
      style={featured ? { boxShadow: '0 0 0 1px rgba(240,164,183,0.40), 0 20px 40px rgba(240,164,183,0.08)' } : undefined}
    >
      {featured && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[9.5px] font-bold uppercase tracking-wider px-2 py-1 rounded-b"
          style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
          ★ Most popular
        </span>
      )}

      <div className="flex items-center gap-2 mb-3 mt-2">
        <span className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
          {icon}
        </span>
        <p className="font-bold text-[15px] tracking-tight">{tier}</p>
      </div>

      <p className="text-[13.5px] text-[var(--fg-dim)] mb-5 leading-relaxed">{tagline}</p>

      <p className="text-[20px] font-bold tabular-nums mb-5" style={{ letterSpacing: '-0.02em' }}>{price}</p>

      <ul className="space-y-2 mb-7 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--fg-dim)]">
            <span className="w-4 h-4 rounded flex items-center justify-center mt-0.5 shrink-0"
              style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
              <Check size={9} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      <Link href={ctaHref} className={`btn ${featured ? 'btn-primary' : 'btn-secondary'} w-full mt-auto`}>
        {cta} <ArrowRight size={13} />
      </Link>
    </div>
  )
}

function ProductCard({ p }: { p: FeaturedProduct }) {
  return (
    <Link href={`/products/${p.slug}`} className="card card-hover overflow-hidden flex flex-col group">
      <div
        className="h-32 relative"
        style={{
          background: p.image_url
            ? `url(${p.image_url}) center/cover`
            : 'linear-gradient(135deg, rgba(240,164,183,0.20), rgba(162,200,238,0.20))',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        {p.featured && (
          <span className="absolute top-3 left-3 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1"
            style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
            <Star size={9} /> Featured
          </span>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-[14.5px] truncate flex-1">{p.name}</p>
          <span className="text-[10px] font-mono text-[var(--fg-mute)]">v{p.version}</span>
        </div>
        {p.tagline && <p className="text-[12.5px] text-[var(--fg-dim)] line-clamp-2 leading-relaxed mb-4">{p.tagline}</p>}
        <div className="mt-auto pt-3 border-t flex items-end justify-between" style={{ borderColor: 'var(--hairline)' }}>
          {p.price_lifetime != null
            ? <span className="text-[18px] font-bold tabular-nums" style={{ letterSpacing: '-0.02em' }}>{formatPrice(p.price_lifetime)}</span>
            : <span />}
          <span className="text-[12px] text-[var(--brand)] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            View <ArrowRight size={10} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card p-6">
      <p className="label-mono mb-4">{n}</p>
      <h3 className="font-semibold text-[16.5px] mb-2 tracking-tight">{title}</h3>
      <p className="text-[13px] text-[var(--fg-dim)] leading-relaxed">{body}</p>
    </div>
  )
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-5">
      <span className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
        style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
        {icon}
      </span>
      <h3 className="font-semibold text-[14.5px] mb-1.5 tracking-tight">{title}</h3>
      <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed">{body}</p>
    </div>
  )
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <p className="font-semibold text-[11px] uppercase tracking-wider text-[var(--fg-mute)] mb-2.5">{title}</p>
      {items.map(([label, href]) => (
        <Link key={label} href={href} className="block text-[var(--fg-dim)] hover:text-[var(--fg)] py-1 transition-colors">
          {label}
        </Link>
      ))}
    </div>
  )
}
