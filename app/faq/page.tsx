import { PublicShell } from '@/components/PublicShell'

export const metadata = { title: 'FAQ' }

const faqs = [
  { q: 'What is OP?',                                         a: 'OP is a resell panel marketplace. Users top up their wallet, generate license keys at discounted rates, and resell those keys to their own customers.' },
  { q: 'How does the wallet work?',                            a: 'Top up your balance by redeeming a master code or via Stripe. Your balance is in USD cents and is spent whenever you generate a license. No balance expires.' },
  { q: 'Where do redeem codes come from?',                     a: 'Codes are issued by the OP team or your upstream parent reseller. Paste any valid code on the Top-up page to credit your balance.' },
  { q: 'What happens after I generate a key?',                  a: 'The key appears in your Licenses page. You give it to your customer or use it yourself. Status updates (active / expired / banned) reflect tool state.' },
  { q: 'Do you offer refunds?',                                a: 'All purchases are non-refundable. Wallet balance is non-transferable. If you initiate a chargeback, your account is permanently terminated.' },
  { q: 'Can I share my account?',                              a: 'No. Account sharing is detected and results in immediate suspension. Each user gets their own account — even resellers.' },
  { q: 'What if the tool stops working?',                      a: 'Open a support ticket with the license key, your HWID if known, and what happened. We respond within 24h, faster for high-priority tickets.' },
  { q: 'How do I become a reseller with discounted rates?',    a: 'Reach out through a support ticket. Approval is at our discretion and depends on volume + reputation.' },
  { q: 'Where can I see updates and announcements?',           a: 'A banner appears on the dashboard whenever we post one. Important news (maintenance, new tools, price changes) is also emailed to your account address.' },
  { q: 'Is OP legal in my country?',                            a: 'OP is provided for educational and research purposes. It is your responsibility to ensure your use complies with local law and any third-party terms.' },
]

export default function FAQPage() {
  return (
    <PublicShell>
      <p className="label-mono mb-3">Help</p>
      <h1 className="text-[36px] font-bold tracking-tight mb-2" style={{ letterSpacing: '-0.025em' }}>
        Frequently asked questions
      </h1>
      <p className="text-[15px] text-[var(--fg-dim)] mb-12">
        The answers to the things we get asked the most. Still stuck? Open a support ticket from your dashboard.
      </p>

      <div className="border-t" style={{ borderColor: 'var(--hairline)' }}>
        {faqs.map((f, i) => (
          <details
            key={i}
            className="group border-b py-6"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <summary
              className="cursor-pointer text-[15.5px] font-semibold flex items-start justify-between gap-4 list-none"
              style={{ color: 'var(--fg)' }}
            >
              <span>{f.q}</span>
              <span
                className="text-[var(--brand)] mt-1 transition-transform group-open:rotate-45 shrink-0"
                style={{ fontSize: 22, lineHeight: 1 }}
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-[14.5px] text-[var(--fg-dim)] leading-[1.7] pr-8">{f.a}</p>
          </details>
        ))}
      </div>

      <p className="text-[12px] text-[var(--fg-mute)] mt-10">
        Question not here? Open a ticket from your dashboard and we&apos;ll add it.
      </p>
    </PublicShell>
  )
}
