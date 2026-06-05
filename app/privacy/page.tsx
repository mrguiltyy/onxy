import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

const sections = [
  { n: '01', title: 'What we collect', body: 'Email, username, IP, hashed hardware fingerprint, and session activity. We never store raw hardware identifiers — only SHA-256 hashes. We do not collect contact lists, browsing history outside our domain, or biometric data.' },
  { n: '02', title: 'Why we collect it', body: 'To authenticate your license, prevent leaks and account-sharing, detect fraud, and comply with payment processor rules. Logs are retained for 180 days then permanently deleted unless required for an open investigation.' },
  { n: '03', title: 'Who we share with', body: 'We do not sell or rent any personal data. We share minimum necessary data with Stripe (for payments), Resend (for transactional email), and Cloudflare (for delivery). All processors are GDPR/CCPA compliant.' },
  { n: '04', title: 'Your rights',     body: 'You may request a copy of your data, request deletion, or withdraw consent at any time by emailing privacy@onyx.gg. Deletion removes your account, all licenses, and all logs except those required for legal compliance.' },
  { n: '05', title: 'Cookies',         body: 'We use strictly necessary cookies for authentication. We do not use third-party tracking cookies, behavioral advertising, or fingerprinting libraries.' },
  { n: '06', title: 'Children',        body: 'Onyx Services is not intended for children under 16. Accounts found to be in violation will be terminated and data deleted.' },
]

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[64px]" style={{ background: 'var(--bg)' }}>
        <div className="container-x py-20 max-w-3xl">
          <span className="label-mono mb-4 block">Legal</span>
          <h1 className="text-[var(--fg)] mb-3" style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            lineHeight: 1,
            letterSpacing: '-0.035em',
            fontWeight: 500,
          }}>
            Privacy Policy
          </h1>
          <p className="text-[var(--fg-mute)] mb-12 font-mono text-[11.5px] uppercase tracking-wider">
            Last updated · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="border-t border-[var(--hairline)]">
            {sections.map(s => (
              <div key={s.n} className="py-8 border-b border-[var(--hairline)] grid grid-cols-12 gap-6">
                <div className="col-span-2 lg:col-span-1">
                  <span className="font-mono text-[11px] text-[var(--fg-mute)] tracking-widest">{s.n}</span>
                </div>
                <div className="col-span-10 lg:col-span-11">
                  <h2 className="text-[var(--fg)] font-semibold text-[18px] mb-2" style={{ letterSpacing: '-0.01em' }}>{s.title}</h2>
                  <p className="text-[var(--fg-dim)] leading-[1.7] text-[14.5px]">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[var(--fg-mute)] text-xs mt-10">
            Questions or requests? Email <a className="link" href="mailto:privacy@onyx.gg">privacy@onyx.gg</a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
