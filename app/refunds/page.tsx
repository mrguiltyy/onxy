import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export default function RefundsPage() {
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
            Refund Policy
          </h1>
          <p className="text-[var(--fg-mute)] mb-12 font-mono text-[11.5px] uppercase tracking-wider">
            Last updated · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <p className="text-[var(--fg-dim)] mb-8 text-[16px] leading-[1.7]">
            Onyx Services is a private digital goods platform. Once a license is issued and accessible from your account,
            the goods have been delivered. We do not issue refunds for delivered licenses except in the cases below.
          </p>

          <div className="border-t border-[var(--hairline)]">
            {[
              { n: '01', title: 'Service outage',  body: 'If our license server is offline for more than 24 cumulative hours within a billing period, you are entitled to prorated credit added to your wallet on request.' },
              { n: '02', title: 'Duplicate charge',body: 'If you were charged twice for the same purchase, contact support within 30 days and we will refund the duplicate immediately.' },
              { n: '03', title: 'Compromised account', body: 'If unauthorized purchases were made due to a confirmed account compromise that was not the result of credential reuse on your part, we will reverse the charges and rotate your credentials.' },
              { n: '04', title: 'Wallet balance',  body: 'Unspent wallet balance is non-refundable to original payment methods. It remains spendable on the platform indefinitely.' },
              { n: '05', title: 'Chargebacks',     body: 'Initiating a chargeback for delivered goods is a violation of our Terms and results in permanent account termination plus blacklisting from future signups.' },
            ].map(s => (
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
            Open a <a className="link" href="/dashboard/tickets">support ticket</a> to request a refund under any of these conditions.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
