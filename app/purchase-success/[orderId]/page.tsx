'use client'
import Link from 'next/link'
import { CheckCircle2, Download, AlertTriangle, Shield, Copy, ArrowRight, MessageSquare, XCircle, Ban, Scale } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { FeatureBullet } from '@/components/ui/FeatureBullet'

export default function PurchaseSuccessPage() {
  const { toast } = useToast()
  const licenseKey = 'ONYX-R4G3-XK2M-9P7Q-LWTZ'

  const copyKey = () => {
    navigator.clipboard.writeText(licenseKey)
    toast({ title: 'License key copied', variant: 'success' })
  }

  return (
    <div className="min-h-screen bg-bg bg-grid-soft flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl flex flex-col gap-5">

        {/* Success */}
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(95,203,136,0.1)', border: '2px solid rgba(95,203,136,0.3)', boxShadow: '0 0 40px rgba(95,203,136,0.15)' }}>
              <CheckCircle2 size={34} className="text-[#5fcb88]" />
            </div>
          </div>
          <h1 className="text-white font-bold text-3xl tracking-tight mb-2" style={{ letterSpacing: '-0.025em' }}>Purchase Confirmed</h1>
          <p className="text-[#9ca3af]">Your access to <span className="text-white font-semibold">Onyx Rage — 1 Month</span> is now active.</p>
          <p className="text-[#9ca3af] text-sm mt-1">Order <span className="code-inline">#ORD-000042</span></p>
        </div>

        {/* License key */}
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold mb-3">Your License Key</p>
          <div className="flex items-center gap-2 bg-[#06080d] border border-[rgba(255,58,0,0.15)] rounded-lg px-4 py-3.5">
            <code className="font-mono text-[#ff3a00] font-bold tracking-widest flex-1 text-sm">{licenseKey}</code>
            <Button variant="ghost" size="sm" icon={<Copy size={13} />} onClick={copyKey}>Copy</Button>
          </div>
          <p className="text-[10px] text-[#6b7280] mt-2">Always available in Dashboard → My Library.</p>
        </Card>

        {/* Download */}
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-[#6b7280] font-semibold mb-3">Download</p>
          <div className="flex items-center justify-between bg-[#0e1119] rounded-lg px-4 py-3.5 border border-white/[0.04]">
            <div>
              <p className="text-white font-semibold text-sm">Onyx Rage v2.1.0</p>
              <p className="text-[#9ca3af] text-xs">4.2 MB · Windows x64 · .exe</p>
            </div>
            <Button variant="primary" size="sm" icon={<Download size={13} />}>Download</Button>
          </div>
        </Card>

        {/* Security warning */}
        <Card className="p-5" style={{ borderColor: 'rgba(255,174,80,0.2)', background: 'rgba(255,174,80,0.05)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={19} className="text-[#ffae50] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#ffae50] font-bold text-base mb-2">Do NOT Share Your Download</p>
              <p className="text-[#d4d4d8] text-sm leading-relaxed mb-3">
                Your download link and file are <strong className="text-white">personally tied to your account</strong>.
                Sharing or leaking results in:
              </p>
              <ul className="flex flex-col gap-2">
                <li>
                  <FeatureBullet icon={<Ban       size={11} strokeWidth={2.25} />} tone="danger">
                    <span className="text-[#d4d4d8]">Immediate permanent ban</span>
                  </FeatureBullet>
                </li>
                <li>
                  <FeatureBullet icon={<XCircle   size={11} strokeWidth={2} />} tone="danger">
                    <span className="text-[#d4d4d8]">All licenses revoked, no refund</span>
                  </FeatureBullet>
                </li>
                <li>
                  <FeatureBullet icon={<Scale     size={11} strokeWidth={2} />} tone="danger">
                    <span className="text-[#d4d4d8]">Potential legal action</span>
                  </FeatureBullet>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* How we log */}
        <Card className="p-5" style={{ borderColor: 'rgba(255,58,0,0.12)', background: 'rgba(255,58,0,0.03)' }}>
          <div className="flex items-start gap-3">
            <Shield size={17} className="text-[#ff3a00] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#ff3a00] font-bold text-sm mb-2">How We Log for Security</p>
              <p className="text-[#9ca3af] text-xs leading-relaxed mb-2">
                Every tool session is authenticated and logged to protect our platform from unauthorized use. We record:
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-[#9ca3af]">
                {[
                  'Hardware ID (SHA256 hash)',
                  'IP address + location',
                  'Session start/end',
                  'Tool version',
                  'Heartbeat pings',
                  'Download events',
                ].map(l => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-[#ff3a00] shrink-0" />
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-[#6b7280] text-[10px] mt-3">
                Used solely for license enforcement and fraud prevention. Never sold or shared.
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/dashboard/library" className="btn btn-primary flex-1 !py-3 justify-center"><Download size={14} /> Go to Library</Link>
          <Link href="/dashboard/tickets/new" className="btn btn-line flex-1 !py-3 justify-center"><MessageSquare size={14} /> Support</Link>
          <Link href="/shop" className="btn btn-ghost flex-1 !py-3 justify-center">Browse More <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  )
}
