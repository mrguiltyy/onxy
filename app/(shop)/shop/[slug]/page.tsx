import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Cpu, RefreshCw, Download, CheckCircle2, ChevronRight, Zap, Link2 } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/Card'
import { FeatureBullet } from '@/components/ui/FeatureBullet'

const product = {
  slug: 'onyx-rage', name: 'Onyx Rage', version: '2.1.0',
  category: 'Automation', accent: '#ff3a00', thumbColor: '#0f1a26',
  desc: 'Onyx Rage is our flagship automation tool — precision-built, constantly updated, and impossible to detect. Used by thousands of operators who need an edge.',
  features: [
    'Full automation engine with configurable intervals',
    'Real-time anti-detection refresh cycle',
    'HWID binding — your license, your machine',
    'Silent auto-update on every launch',
    'Session heartbeat with 5-minute validation',
    'Direct support via ticket system',
  ],
  plans: [
    { id: 'monthly',   label: '1 Month',  price:  999, slots: 2 },
    { id: 'quarterly', label: '3 Months', price: 2499, slots: 2, popular: true },
    { id: 'lifetime',  label: 'Lifetime', price: 4999, slots: 2 },
  ],
  changelog: [
    { version: '2.1.0', date: 'Jun 1, 2026',  notes: 'Improved stealth layer, reduced memory footprint by 30%.' },
    { version: '2.0.4', date: 'May 18, 2026', notes: 'Hotfix for session timeout edge case on slow connections.' },
    { version: '2.0.0', date: 'May 1, 2026',  notes: 'Major rewrite. New authentication engine, faster heartbeat.' },
  ],
}

export default function ProductPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[68px] pb-20 bg-bg">
        <div className="container-x py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#9ca3af] mb-8">
            <Link href="/shop" className="hover:text-white flex items-center gap-1"><ArrowLeft size={12} /> Shop</Link>
            <ChevronRight size={11} className="text-[#4b5563]" />
            <span className="text-white">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Hero card */}
              <Card className="overflow-hidden">
                <div className="product-art" style={{ background: `linear-gradient(135deg, ${product.thumbColor} 0%, #0e1119 100%)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-2xl flex items-center justify-center" style={{
                        background: `linear-gradient(135deg, ${product.accent} 0%, ${product.thumbColor} 120%)`,
                        boxShadow: `0 8px 40px ${product.accent}40`,
                      }}>
                        <span className="text-5xl font-black text-white" style={{ letterSpacing: '-0.06em' }}>{product.name[0]}</span>
                      </div>
                      <div className="absolute inset-0 rounded-2xl blur-2xl opacity-50 -z-10" style={{ background: product.accent }} />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <StatusBadge tone="ok" dot>Undetected</StatusBadge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="status status-mute">v{product.version}</span>
                  </div>
                </div>
                <div className="p-6 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="status status-mute">{product.category}</span>
                  </div>
                  <h1 className="text-white font-bold text-3xl tracking-tight mb-2" style={{ letterSpacing: '-0.025em' }}>{product.name}</h1>
                  <p className="text-[#9ca3af] leading-relaxed">{product.desc}</p>
                </div>
              </Card>

              {/* Features */}
              <Card className="p-6">
                <h3 className="section-h-title mb-4">What&apos;s Included</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.features.map(f => (
                    <div key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 size={14} className="text-[#5fcb88] mt-0.5 shrink-0" />
                      <span className="text-[#d4d4d8] text-[13.5px]">{f}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Security */}
              <Card className="p-6">
                <h3 className="section-h-title mb-4">Security &amp; DRM</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: Cpu,        label: 'HWID Binding', desc: 'Locked to your hardware' },
                    { icon: RefreshCw,  label: 'Auto-Update',  desc: 'Silent on every launch'  },
                    { icon: ShieldCheck,label: 'Session Auth', desc: '5-minute heartbeat'      },
                  ].map(s => {
                    const I = s.icon
                    return (
                      <div key={s.label} className="bg-[#0e1119] rounded-lg p-4 border border-white/[0.04]">
                        <I size={17} className="text-[#ff3a00] mb-2" />
                        <p className="text-white text-sm font-semibold">{s.label}</p>
                        <p className="text-[#9ca3af] text-xs mt-0.5">{s.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Changelog */}
              <Card className="p-6">
                <h3 className="section-h-title mb-4">Changelog</h3>
                <div className="flex flex-col gap-4">
                  {product.changelog.map((c, i) => (
                    <div key={c.version} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${i === 0 ? 'bg-[#ff3a00]' : 'bg-[#4b5563]'}`} />
                        {i < product.changelog.length - 1 && <div className="w-px flex-1 bg-white/[0.04] mt-1" />}
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-white">v{c.version}</span>
                          {i === 0 && <StatusBadge tone="cyan">Latest</StatusBadge>}
                          <span className="text-[#6b7280] text-xs">{c.date}</span>
                        </div>
                        <p className="text-[#d4d4d8] text-sm">{c.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: buy */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="p-6 flex flex-col gap-4">
                  <div>
                    <p className="text-[#6b7280] text-xs uppercase tracking-wider font-semibold mb-1">Starting from</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-[#ff3a00]" style={{ letterSpacing: '-0.025em' }}>${(product.plans[0].price / 100).toFixed(2)}</span>
                      <span className="text-[#9ca3af] text-sm">/mo</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold mb-1">Plans</p>
                    {product.plans.map(plan => (
                      <div
                        key={plan.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          plan.popular ? 'bg-[rgba(255,58,0,0.06)] border-[rgba(255,58,0,0.25)]' : 'bg-[#0e1119] border-white/[0.06] hover:border-[rgba(255,58,0,0.15)]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold text-sm">{plan.label}</p>
                            {plan.popular && <StatusBadge tone="cyan">Best Value</StatusBadge>}
                          </div>
                          <p className="text-[#9ca3af] text-xs">{plan.slots} HWID slots</p>
                        </div>
                        <p className="text-white font-bold">${(plan.price / 100).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <Link href={`/shop/${product.slug}/checkout`} className="btn btn-primary !py-3 font-bold flex items-center justify-center gap-2 w-full">
                    <Download size={15} /> Purchase Now
                  </Link>

                  <div className="flex flex-col gap-2">
                    <FeatureBullet icon={<Zap          size={11} strokeWidth={2.25} />} tone="success">Instant delivery after payment</FeatureBullet>
                    <FeatureBullet icon={<Cpu          size={11} strokeWidth={2} />}    tone="cyan">Personal HWID-locked link</FeatureBullet>
                    <FeatureBullet icon={<Download     size={11} strokeWidth={2} />}    tone="cyan">Re-download anytime</FeatureBullet>
                    <FeatureBullet icon={<RefreshCw    size={11} strokeWidth={2} />}    tone="cyan">Auto-updates included</FeatureBullet>
                  </div>

                  <p className="text-[10px] text-[#6b7280] text-center leading-relaxed border-t border-white/[0.04] pt-3">
                    Non-refundable. Sharing your download results in a permanent ban.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
