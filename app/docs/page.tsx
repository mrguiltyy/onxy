import Link from 'next/link'
import { ArrowRight, Code, Cpu, Shield, RefreshCw, Gift, AlertTriangle, KeyRound } from 'lucide-react'

const cards = [
  { href: '/docs/quickstart',     icon: Code,          title: 'Quick Start',       desc: 'Get your tool authenticated in under 10 minutes.' },
  { href: '/docs/authentication', icon: KeyRound,      title: 'Authentication',    desc: 'The auth handshake — how a license key becomes a session.' },
  { href: '/docs/hwid',           icon: Cpu,           title: 'HWID Binding',      desc: 'How to generate, send, and lock to a hardware fingerprint.' },
  { href: '/docs/heartbeat',      icon: Shield,        title: 'Heartbeat',         desc: 'Keep sessions alive with 5-minute pings.' },
  { href: '/docs/auto-update',    icon: RefreshCw,     title: 'Auto-Update',       desc: 'How your tool checks and swaps its own binary on launch.' },
  { href: '/docs/redeem-codes',   icon: Gift,          title: 'Redeem Codes',      desc: 'How redeem codes work and how to integrate them.' },
  { href: '/docs/error-handling', icon: AlertTriangle, title: 'Error Handling',    desc: 'Every error code and how to respond to it.' },
  { href: '/docs/wpf-integration',icon: Code,          title: 'WPF Integration',   desc: 'Full C# code example — drop into your existing WPF project.' },
]

export default function DocsHomePage() {
  return (
    <>
      <div className="mb-10">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff3a00]">Documentation</span>
        <h1 className="text-white font-bold text-4xl tracking-tight mt-2 mb-3" style={{ letterSpacing: '-0.025em' }}>
          Onyx Integration Docs
        </h1>
        <p className="text-[#9ca3af] text-base leading-relaxed">
          Everything you need to integrate Onyx authentication, HWID binding, and auto-updates
          into your application. Built for WPF / .NET, but works with any platform that can
          make HTTP requests.
        </p>
      </div>

      {/* Quick start CTA */}
      <Link href="/docs/quickstart"
        className="block mb-10 p-6 rounded-xl border border-[rgba(255,58,0,0.15)] bg-[rgba(255,58,0,0.04)] hover:bg-[rgba(255,58,0,0.06)] hover:border-[rgba(255,58,0,0.3)] transition-all group">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[rgba(255,58,0,0.1)] border border-[rgba(255,58,0,0.2)] flex items-center justify-center shrink-0">
            <Code size={20} className="text-[#ff3a00]" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-lg">Start here →</p>
            <p className="text-[#9ca3af] text-sm">10-minute quick start to get your tool authenticated.</p>
          </div>
          <ArrowRight size={18} className="text-[#ff3a00] group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      <h2>Topics</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 not-prose">
        {cards.map(c => {
          const I = c.icon
          return (
            <Link key={c.href} href={c.href} className="card card-cyan-hover p-5 group block">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[rgba(255,58,0,0.08)] border border-[rgba(255,58,0,0.15)] flex items-center justify-center shrink-0">
                  <I size={16} className="text-[#ff3a00]" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-[14.5px] mb-1">{c.title}</p>
                  <p className="text-[#9ca3af] text-[13px] leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <h2 className="mt-12">Need help?</h2>
      <p>
        If you&apos;re stuck, open a ticket in <Link href="/dashboard/tickets" className="text-[#ff3a00] hover:underline">Support</Link>.
        Most integration questions are answered within an hour. Premium &amp; Diamond tier users get priority queue.
      </p>
    </>
  )
}
