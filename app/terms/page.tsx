import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

const sections = [
  { n: '01', title: 'Account',         body: 'You must provide a valid email and choose a strong password. You are responsible for activity on your account. Sharing your credentials is a violation of these terms and triggers immediate termination.' },
  { n: '02', title: 'Licensing',       body: 'Every purchase grants you a personal, non-transferable license bound to your hardware via HWID. You may not resell, redistribute, modify, reverse-engineer, or share any tool unless you hold an active Reseller agreement with us.' },
  { n: '03', title: 'Payments',        body: 'Purchases are processed by Stripe and are non-refundable except where required by law. Wallet balances are stored in USD cents and may be spent on any product. Subscriptions auto-renew unless cancelled at least 24 hours before renewal.' },
  { n: '04', title: 'Acceptable use',  body: 'You may not use Onyx tools to violate any third-party terms of service that would expose us to legal risk. We reserve the right to terminate any account at our sole discretion.' },
  { n: '05', title: 'Termination',     body: 'Sharing your download link, leaking a binary, attempting to crack or modify our software, or repeatedly failing license authentication will result in permanent termination, revocation of all active licenses, and forfeiture of any remaining wallet balance.' },
  { n: '06', title: 'Liability',       body: 'Onyx Services is provided "as is" without warranty of any kind. We are not liable for any indirect or consequential damages arising from use of our tools.' },
  { n: '07', title: 'Changes',         body: 'We may update these terms at any time. Material changes will be announced via email and our Discord. Continued use after a change constitutes acceptance.' },
]

export default function TermsPage() {
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
            Terms of Service
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
            Questions? Email <a className="link" href="mailto:legal@onyx.gg">legal@onyx.gg</a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
