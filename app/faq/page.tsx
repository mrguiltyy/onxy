import { PublicShell } from '@/components/PublicShell'

export const metadata = {
  title: 'FAQ — Common Questions about OP',
  description: 'Everything you need to know about OP — buying license keys, becoming a reseller, white-labeling our catalog, using the auth engine in your own apps, and lifetime support.',
  keywords: ['OP FAQ', 'resell panel FAQ', 'auth.gg alternative', 'license key questions', 'HWID reset', 'reseller program FAQ', 'KeyAuth alternative'],
}

const groups: { name: string; faqs: { q: string; a: string }[] }[] = [
  {
    name: 'Getting started',
    faqs: [
      { q: 'What is OP?',
        a: 'OP is a marketplace + auth engine for private software tools. Three things happen here: (1) anyone can buy lifetime tools, (2) approved resellers can white-label our catalog and sell at wholesale, and (3) the auth-engine SDK lets you embed HWID-locked licensing into your own .NET / C++ / Python / Node / Java apps.' },
      { q: 'How fast is signup?',
        a: 'About 20 seconds. Email or Discord OAuth (Discord gives you $1 wallet credit on link). You can browse the catalog without signing up.' },
      { q: 'Do I need to pay to browse?',
        a: 'No. The marketplace, reseller plans, blog, FAQ, and docs are all public. You only need an account to buy keys or generate them.' },
      { q: 'What devices do I need?',
        a: 'Just a web browser to manage your account. The tools themselves are typically Windows binaries — system requirements are listed on each product page.' },
      { q: 'How long does delivery take?',
        a: 'Instant. The second your payment clears Stripe (or your wallet has enough credit), your key shows up in your dashboard and you can use the tool.' },
    ],
  },
  {
    name: 'Wallet & payments',
    faqs: [
      { q: 'How does the wallet work?',
        a: 'Your wallet stores USD in cents. You top up via Stripe (card payment, $5 minimum, instant credit) or by redeeming a master code from your upstream parent. Every purchase deducts from the wallet — no need to enter card details for each buy.' },
      { q: 'What payment methods do you accept?',
        a: 'Stripe-backed cards (Visa, Mastercard, Amex), redeem codes from your reseller parent, and Discord-link bonus credit ($1 once per account). Crypto coming soon.' },
      { q: 'Do you offer refunds?',
        a: 'All sales are final. Wallet balance is non-transferable and has no cash value. Chargeback initiations result in immediate permanent account termination plus license revocation.' },
      { q: 'Why was my payment declined?',
        a: 'Stripe declines come from your bank, not us — usually fraud-prevention flags. Try a different card or a different network (cellular vs. WiFi). If it keeps happening, open a ticket.' },
      { q: 'Is there a minimum top-up?',
        a: '$5.00. Maximum single top-up is $5,000.' },
    ],
  },
  {
    name: 'Licenses & HWID',
    faqs: [
      { q: 'What is an HWID?',
        a: 'HWID is a hardware fingerprint computed from your CPU\'s ProcessorId and your motherboard\'s SerialNumber, hashed SHA-256. On first login, the tool sends its HWID and we bind it to your license. Subsequent logins from other hardware are rejected.' },
      { q: 'I bought a new PC — can I reset my HWID?',
        a: 'Yes. Each license includes 3 self-serve resets, with a 24-hour cooldown between them. From your dashboard, click any license, then "Reset HWID". Your next tool login binds your new hardware automatically.' },
      { q: 'I used all my resets. Now what?',
        a: 'Open a ticket explaining what changed (PC swap, mobo replacement, etc.) and we\'ll do a manual reset. Lifetime buyers get priority on this.' },
      { q: 'Can I share my license with a friend?',
        a: 'No. Sharing a key results in immediate ban for both accounts and license revocation. Each tool installation must match the bound HWID.' },
      { q: 'What does "key_wrong_app" mean in my error?',
        a: 'You\'re trying to use a license issued for a different application. Make sure the tool you\'re running matches the product you bought.' },
    ],
  },
  {
    name: 'Reseller program',
    faqs: [
      { q: 'What does the reseller tier give me?',
        a: 'After buying a reseller plan ($14.99/mo Starter, $29.99/mo Pro, $299 Elite lifetime), you can apply to white-label any active product. Approved → you pay wholesale (typically 25% of retail) per key you generate, with extra discount on Pro/Elite. You also get unlimited "applications" — your own WPF tools using our auth engine.' },
      { q: 'What\'s the difference between reseller and white-label/rebrand?',
        a: 'A reseller sells OUR catalog (your branding on our tools, but customers come to onxy.cc). A rebrand/white-label tenant runs THEIR OWN mini-OP on a separate subdomain — their own tools, users, panel. Rebrand is being built; ask about pricing.' },
      { q: 'Do I get notified when a product I resell gets an update?',
        a: 'Yes. The instant an admin publishes a new release, every approved reseller of that product gets an in-app notification and a Discord webhook ping (if configured).' },
      { q: 'Can I set my own retail price?',
        a: 'You control the markup. You pay wholesale to OP; whatever you charge your customers on top is yours.' },
      { q: 'How do I apply to resell a specific product?',
        a: 'On the product page (e.g. /products/sample-tool), the right sidebar has an "Apply to resell" button. Fill in your branded name, pitch, and (optionally) custom image. Admin reviews within 24h.' },
    ],
  },
  {
    name: 'Auth engine (for tool developers)',
    faqs: [
      { q: 'What is the auth engine?',
        a: 'A drop-in license-validation API that runs HWID-binding, brute-force throttling, heartbeat sessions, and bans. Embed it in your own .NET / C++ / Python / Node / Java / VB.NET tool, register the tool as an "application" in your dashboard, and you have auth.gg-style licensing in 10 lines of code.' },
      { q: 'Which languages have SDKs?',
        a: 'C# / .NET, C++, Python 3.9+, Node.js 18+, Java 11+, and VB.NET. There\'s also a raw REST reference for everything else (Go / Rust / PHP / Lua / etc.). Full docs and code examples are at /dashboard/docs after sign-in.' },
      { q: 'Is the API rate-limited?',
        a: '10 failed login attempts per IP per app per minute triggers a 5-minute block, automatically. You can\'t configure this — it\'s built-in DDoS protection. /check and /heartbeat have higher limits.' },
      { q: 'How do I rotate my app_secret if it leaks?',
        a: 'From /dashboard/applications/[id] click "Rotate secret". All currently signed-in users of your tool will be kicked at their next heartbeat. You then update your binary with the new secret and ship.' },
      { q: 'Are sessions persistent?',
        a: 'Sessions last 24 hours, refreshed by every successful /heartbeat call. After 24h of inactivity, the user must re-login.' },
    ],
  },
  {
    name: 'Support & policies',
    faqs: [
      { q: 'How do I open a ticket?',
        a: 'From the dashboard, click Tickets → New ticket. We auto-suggest the troubleshooter first because it fixes about 80% of issues without involving humans.' },
      { q: 'What\'s the troubleshooter?',
        a: 'A wizard at /dashboard/troubleshoot that auto-diagnoses common errors (HWID mismatch / invalid key / expired / rate-limited / won\'t connect) and runs the fix immediately — or pre-fills a ticket with the diagnosis if the bot can\'t handle it.' },
      { q: 'How fast do tickets get answered?',
        a: 'Standard: within 24 hours. Priority (lifetime buyers + reseller Pro/Elite): within 4 hours during business hours.' },
      { q: 'Is OP legal in my country?',
        a: 'OP is provided for educational and research purposes. Buyers assume all responsibility for tool usage. We do not endorse any usage that violates local law or third-party terms of service.' },
      { q: 'Where do I read the legal stuff?',
        a: 'Terms: /terms · Privacy: /privacy. Both link from every page footer.' },
      { q: 'How do I close my account?',
        a: 'Open a ticket asking for account deletion. We delete your profile, licenses, transactions, and tickets — but keep an audit log of the deletion event for 30 days to comply with anti-fraud requirements.' },
    ],
  },
]

export default function FAQPage() {
  return (
    <PublicShell>
      <p className="label-mono mb-3">Help</p>
      <h1 className="text-[36px] md:text-[44px] font-bold tracking-tight mb-3" style={{ letterSpacing: '-0.025em' }}>
        Frequently asked questions
      </h1>
      <p className="text-[15px] text-[var(--fg-dim)] mb-10 max-w-[560px] leading-relaxed">
        Everything you need to know about OP — buying keys, becoming a reseller, using the auth engine, HWID resets, and more.
      </p>

      {groups.map(group => (
        <section key={group.name} className="mb-10">
          <h2 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--brand)] mb-3">{group.name}</h2>
          <div className="space-y-2">
            {group.faqs.map((f, i) => (
              <details key={i} className="card p-5 group">
                <summary className="cursor-pointer flex items-center justify-between gap-3 font-semibold text-[14.5px] leading-snug list-none">
                  <span>{f.q}</span>
                  <span className="text-[var(--brand)] text-[18px] transition-transform group-open:rotate-45 shrink-0">＋</span>
                </summary>
                <p className="text-[13.5px] text-[var(--fg-dim)] mt-3 leading-relaxed whitespace-pre-wrap">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="card p-6 mt-10 text-center" style={{
        background: 'var(--brand-faint)', border: '1px solid rgba(59,130,246,0.25)',
      }}>
        <p className="text-[14px] font-semibold mb-1">Didn&apos;t find your answer?</p>
        <p className="text-[12.5px] text-[var(--fg-dim)] mb-4">
          Open a ticket from your dashboard. Most tickets get a reply within a few hours.
        </p>
        <a href="/login" className="btn btn-primary btn-sm">Sign in to open a ticket →</a>
      </div>

      {/* JSON-LD for Google rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: groups.flatMap(g =>
              g.faqs.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              }))
            ),
          }),
        }}
      />
    </PublicShell>
  )
}
