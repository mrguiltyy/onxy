import { PublicShell } from '@/components/PublicShell'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <PublicShell>
      <p className="label-mono mb-3">Legal</p>
      <h1 className="text-[36px] font-bold tracking-tight mb-2" style={{ letterSpacing: '-0.025em' }}>Privacy Policy</h1>
      <p className="text-[13px] text-[var(--fg-mute)] mb-12 font-mono uppercase tracking-wider">
        Last updated · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {[
        { n: '01', title: 'What we collect',  body: 'Email, username, IP, hashed hardware fingerprint (when sent from a tool), wallet balance, and your activity on the panel. We never store plaintext payment details — Stripe handles that.' },
        { n: '02', title: 'Why we collect it', body: 'To deliver the service, authenticate licenses against your account, detect fraud, and meet legal obligations. Logs are retained for 180 days then deleted unless required for an open investigation.' },
        { n: '03', title: 'Who we share with', body: 'Only processors we strictly need: Supabase (database + auth), Resend (transactional email), Stripe (payments), Cloudflare/Hetzner (hosting). We never sell data.' },
        { n: '04', title: 'Your rights',     body: 'Request a data export, deletion, or correction via support ticket. Deletion removes your account and all licenses; logs we are legally required to keep are retained for the minimum period.' },
        { n: '05', title: 'Cookies',         body: 'We use strictly necessary cookies for authentication. No third-party tracking or behavioral advertising cookies.' },
        { n: '06', title: 'Children',        body: 'OP is not intended for anyone under 16. Underage accounts are terminated and deleted.' },
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
    </PublicShell>
  )
}
