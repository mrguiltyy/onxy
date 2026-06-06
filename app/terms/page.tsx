import { PublicShell } from '@/components/PublicShell'

export const metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <PublicShell>
      <p className="label-mono mb-3">Legal</p>
      <h1 className="text-[36px] font-bold tracking-tight mb-2" style={{ letterSpacing: '-0.025em' }}>Terms of Service</h1>
      <p className="text-[13px] text-[var(--fg-mute)] mb-12 font-mono uppercase tracking-wider">
        Last updated · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="rounded-md p-5 mb-10" style={{ background: 'var(--brand-faint)', border: '1px solid rgba(240,164,183,0.30)' }}>
        <p className="text-[13.5px] font-semibold text-[var(--brand)] mb-1">Educational use disclaimer</p>
        <p className="text-[13.5px] text-[var(--fg-dim)] leading-relaxed">
          The services and tools offered through OP are provided <strong className="text-[var(--fg)]">for educational and research purposes only</strong>.
          We do not endorse, support, or condone any use that violates the laws of your jurisdiction or the
          terms of service of any third-party platform. After purchase, the buyer assumes
          <strong className="text-[var(--fg)]"> all responsibility </strong>
          for how the tools are used. OP accepts no liability for misuse, third-party damages,
          account bans on external platforms, or any consequences arising from purchaser conduct.
        </p>
      </div>

      {[
        { n: '01', title: 'Acceptance',  body: 'By creating an account, you agree to these terms. If you don\'t agree, don\'t sign up. We may update these terms; material changes will be announced via the dashboard banner.' },
        { n: '02', title: 'Account',     body: 'You are responsible for your account credentials and any activity on it. Account sharing is strictly prohibited and results in immediate termination without refund.' },
        { n: '03', title: 'Educational purpose', body: 'All software offered through OP is provided strictly for educational research, security testing on your own systems, and self-learning. You are responsible for ensuring your use complies with all applicable laws and third-party terms.' },
        { n: '04', title: 'No warranty', body: 'Services are provided "as is" without warranty of any kind. We make no guarantee of fitness for any particular purpose, uptime, or compatibility with any third-party platform now or in the future.' },
        { n: '05', title: 'No liability for use', body: 'You are solely responsible for how you use the tools. OP accepts no liability for damages, losses, account suspensions on external platforms, legal consequences, or any other outcome arising from your use after purchase.' },
        { n: '06', title: 'Payments',    body: 'Purchases are non-refundable except where required by law. Wallet balances are non-transferable and have no cash value. Initiating a chargeback constitutes a breach of these terms and results in immediate permanent termination.' },
        { n: '07', title: 'Acceptable use', body: 'You may not use OP to harass, harm, or unlawfully target any person. Doing so terminates your account and may be reported to authorities.' },
        { n: '08', title: 'Termination', body: 'We may suspend or terminate any account at any time, for any reason. Sharing, leaking, reverse-engineering, or redistributing any tool obtained through OP results in permanent termination plus license revocation.' },
        { n: '09', title: 'Indemnity',   body: 'You agree to indemnify and hold harmless OP, its operators, and affiliates from any claim arising from your use of the platform.' },
        { n: '10', title: 'Governing law', body: 'These terms are governed by the laws applicable to the operator\'s jurisdiction. Any disputes will be resolved there.' },
      ].map(s => (
        <div key={s.n} className="py-7 border-b" style={{ borderColor: 'var(--hairline)' }}>
          <div className="flex gap-5">
            <span className="font-mono text-[11px] text-[var(--fg-mute)] tracking-widest pt-1">{s.n}</span>
            <div>
              <h2 className="text-[18px] font-semibold mb-2">{s.title}</h2>
              <p className="text-[14.5px] text-[var(--fg-dim)] leading-[1.7]">{s.body}</p>
            </div>
          </div>
        </div>
      ))}

      <p className="text-[12px] text-[var(--fg-mute)] mt-10">
        Questions? Open a support ticket from your dashboard.
      </p>
    </PublicShell>
  )
}
