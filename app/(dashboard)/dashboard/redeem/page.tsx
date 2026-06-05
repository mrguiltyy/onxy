'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Gift, CheckCircle2, AlertCircle, Sparkles, Wallet, Package, Tag } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface RedeemResult {
  type:     'license' | 'credit' | 'discount'
  title:    string
  detail:   string
  badge?:   string
}

const history = [
  { code: 'LAUNCH-WEEK',  reward: 'Onyx Core — 7 days',     when: 'May 28, 2026' },
  { code: 'SUMMER-25',    reward: '$25.00 wallet credit',   when: 'May 12, 2026' },
  { code: 'WELCOME-NEW',  reward: '50% off any product',    when: 'Apr 1, 2026'  },
]

export default function RedeemPage() {
  const { toast } = useToast()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RedeemResult | null>(null)
  const [error, setError]   = useState('')

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    await new Promise(r => setTimeout(r, 900))

    // Demo handling — show success or error based on test code
    const upper = code.trim().toUpperCase()
    if (upper === 'INVALID') {
      setError('CODE_NOT_FOUND — that code doesn\'t exist.')
      toast({ title: 'Invalid code', description: 'That code doesn\'t exist or has been used.', variant: 'error' })
    } else if (upper === 'EXPIRED') {
      setError('CODE_EXPIRED — this code has expired.')
      toast({ title: 'Expired code', variant: 'error' })
    } else if (upper.startsWith('CREDIT')) {
      setResult({ type: 'credit',  title: '$25.00 added to wallet',  detail: 'Your new balance is $167.50',  badge: 'Wallet Credit' })
      toast({ title: 'Code redeemed', description: '$25.00 added to your wallet.', variant: 'success' })
    } else if (upper.startsWith('DISCOUNT')) {
      setResult({ type: 'discount', title: '20% discount unlocked', detail: 'Apply at checkout — expires in 24h.', badge: 'Discount' })
      toast({ title: 'Discount unlocked', description: 'Use it at checkout within 24 hours.', variant: 'success' })
    } else {
      setResult({ type: 'license', title: 'Onyx Core — 7 days granted', detail: 'License added to your library. Expires in 7 days.', badge: 'License' })
      toast({ title: 'License granted', description: 'Check your library for the new license.', variant: 'success' })
    }

    setCode('')
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl tracking-tight">Redeem Code</h1>
        <p className="text-[#9ca3af] text-sm mt-1">Got a code? Enter it below to claim your reward.</p>
      </div>

      {/* Main redeem card */}
      <Card className="p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{ background: 'rgba(255,58,0,0.05)', transform: 'translate(40px, -40px)' }} />

        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-[rgba(255,58,0,0.1)] border border-[rgba(255,58,0,0.2)] flex items-center justify-center mb-4">
            <Gift size={22} className="text-[#ff3a00]" />
          </div>

          <form onSubmit={redeem} className="flex flex-col gap-3">
            <Input
              label="Enter your code"
              placeholder="ONYX-XXXX-XXXX"
              value={code}
              onChange={e => setCode(e.target.value)}
              icon={<Tag size={14} />}
              className="!py-3.5 font-mono tracking-widest text-base !uppercase"
              autoComplete="off"
              autoCapitalize="characters"
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full !py-3.5" icon={<Sparkles size={15} />}>
              {loading ? 'Verifying code...' : 'Redeem Code'}
            </Button>
          </form>

          {/* Success */}
          {result && (
            <div className="mt-5 p-5 rounded-lg border-2 animate-fade-up" style={{ borderColor: 'rgba(95,203,136,0.25)', background: 'rgba(95,203,136,0.06)' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[rgba(95,203,136,0.15)] border border-[rgba(95,203,136,0.3)] flex items-center justify-center shrink-0">
                  <CheckCircle2 size={17} className="text-[#5fcb88]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[#5fcb88] font-bold text-sm">Code Redeemed!</p>
                    {result.badge && <StatusBadge tone="ok">{result.badge}</StatusBadge>}
                  </div>
                  <p className="text-white font-semibold text-base">{result.title}</p>
                  <p className="text-[#9ca3af] text-sm mt-0.5">{result.detail}</p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {result.type === 'license'  && <Link href="/dashboard/library" className="btn btn-line btn-sm">View Library →</Link>}
                    {result.type === 'credit'   && <Link href="/dashboard/wallet"  className="btn btn-line btn-sm">View Wallet →</Link>}
                    {result.type === 'discount' && <Link href="/shop"              className="btn btn-line btn-sm">Browse Products →</Link>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-5 p-4 rounded-lg border animate-fade-up" style={{ borderColor: 'rgba(255,91,117,0.2)', background: 'rgba(255,91,117,0.05)' }}>
              <div className="flex items-start gap-3">
                <AlertCircle size={15} className="text-[#ff5b75] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[#ff5b75] font-semibold text-sm">Couldn&apos;t redeem code</p>
                  <p className="text-[#9ca3af] text-xs mt-0.5 font-mono">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* What you can redeem */}
      <Card className="p-6 mb-5">
        <h3 className="section-h-title mb-4">What codes can give you</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Package, color: '#ff3a00', title: 'License Access', desc: 'Free access to a tool for a set duration.' },
            { icon: Wallet,  color: '#5fcb88', title: 'Wallet Credit',  desc: 'Dollars added to your wallet, spend on anything.' },
            { icon: Tag,     color: '#ff5b75', title: 'Discount',       desc: 'Percentage or flat-rate off your next purchase.' },
          ].map(item => {
            const I = item.icon
            return (
              <div key={item.title} className="bg-[#0e1119] border border-white/[0.04] rounded-lg p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                  <I size={14} style={{ color: item.color }} />
                </div>
                <p className="text-white font-semibold text-[13.5px] mb-1">{item.title}</p>
                <p className="text-[#9ca3af] text-xs leading-relaxed">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* History */}
      <Card className="p-6">
        <h3 className="section-h-title mb-4">Your Redemption History</h3>
        {history.length > 0 ? (
          <table className="table-onyx">
            <thead>
              <tr>
                <th>Code</th>
                <th>Reward</th>
                <th className="text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.code}>
                  <td className="font-mono text-[#ff3a00] font-semibold text-xs">{h.code}</td>
                  <td className="text-white">{h.reward}</td>
                  <td className="text-right">{h.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[#9ca3af] text-sm text-center py-8">You haven&apos;t redeemed any codes yet.</p>
        )}
      </Card>
    </div>
  )
}
