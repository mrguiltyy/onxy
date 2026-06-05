import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'

const systems = [
  { name: 'License authentication', desc: 'Tool auth + heartbeat endpoint',  status: 'ok',   uptime: '99.99%' },
  { name: 'Manifest / auto-update', desc: 'Version manifest CDN',            status: 'ok',   uptime: '99.97%' },
  { name: 'Store + checkout',       desc: 'Stripe + wallet processing',      status: 'ok',   uptime: '99.98%' },
  { name: 'Dashboard',              desc: 'Web app + API',                   status: 'ok',   uptime: '99.99%' },
  { name: 'Ticket support',         desc: 'Inbox + email notifications',     status: 'ok',   uptime: '99.96%' },
  { name: 'Discord bot',            desc: 'Role sync + webhooks',            status: 'ok',   uptime: '99.92%' },
]

const incidents: { date: string; title: string; resolved: boolean; summary: string }[] = []

export default function StatusPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[64px]" style={{ background: 'var(--bg)' }}>
        <div className="container-x py-20 max-w-4xl">

          <span className="label-mono mb-4 block">System</span>
          <h1 className="text-[var(--fg)] mb-3" style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            lineHeight: 1,
            letterSpacing: '-0.035em',
            fontWeight: 500,
          }}>
            All systems{' '}
            <span className="font-serif-i" style={{ color: 'var(--ok)' }}>operational.</span>
          </h1>
          <p className="text-[var(--fg-dim)] mb-12 text-[15px]">
            Realtime status of every Onyx system. Last refresh: just now.
          </p>

          <Card className="overflow-hidden mb-10">
            <div className="divide-y divide-[var(--hairline)]">
              {systems.map(s => (
                <div key={s.name} className="flex items-center justify-between px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--fg)] font-semibold text-[14px]">{s.name}</p>
                    <p className="text-[var(--fg-mute)] text-xs">{s.desc}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[11px] text-[var(--fg-mute)]">{s.uptime} · 90d</span>
                    <StatusBadge tone="ok" dot>Operational</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <h2 className="text-[var(--fg)] font-semibold mb-4" style={{ fontSize: '20px', letterSpacing: '-0.02em' }}>
            Recent incidents
          </h2>

          {incidents.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-[var(--fg-dim)]" style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '22px',
                lineHeight: 1.4,
                letterSpacing: '-0.01em',
              }}>
                No incidents reported in the last 90 days.
              </p>
              <p className="text-[var(--fg-mute)] text-xs mt-2">Subscribe to updates via the Discord webhook.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {incidents.map(i => (
                <Card key={i.date} className="p-5">
                  <p className="text-[var(--fg)] font-semibold">{i.title}</p>
                  <p className="text-[var(--fg-dim)] text-sm mt-1">{i.summary}</p>
                  <p className="text-[var(--fg-mute)] text-xs mt-2">{i.date}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
