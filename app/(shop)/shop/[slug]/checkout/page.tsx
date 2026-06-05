'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Wallet, CreditCard, CheckCircle2, ShieldCheck, Tag, Zap, Link2, ShieldOff } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Radio, RadioGroup } from '@/components/ui/Radio'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { FeatureBullet } from '@/components/ui/FeatureBullet'

const plans = [
  { id: 'monthly',   label: '1 Month',  price:  999, slots: 2 },
  { id: 'quarterly', label: '3 Months', price: 2499, slots: 2, popular: true },
  { id: 'lifetime',  label: 'Lifetime', price: 4999, slots: 2 },
]

export default function CheckoutPage() {
  const { toast } = useToast()
  const [planId, setPlanId] = useState('quarterly')
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [method, setMethod] = useState<'wallet' | 'card'>('wallet')

  const plan = plans.find(p => p.id === planId)!
  const discount = couponApplied ? Math.floor(plan.price * 0.1) : 0
  const total = plan.price - discount
  const balance = 14250

  const applyCoupon = () => {
    if (!coupon) return
    setCouponApplied(true)
    toast({ title: '10% discount applied', variant: 'success' })
  }

  const pay = () => {
    toast({ title: 'Processing payment...', variant: 'info' })
  }

  return (
    <div className="min-h-screen bg-bg bg-grid-soft">
      <div className="container-x py-10">
        <Link href="/shop/onyx-rage" className="inline-flex items-center gap-2 text-[#9ca3af] hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to product
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div>
              <h1 className="text-white font-bold text-2xl tracking-tight">Checkout</h1>
              <p className="text-[#9ca3af] text-sm mt-1">Complete your purchase securely.</p>
            </div>

            {/* Plan selector */}
            <Card className="p-5">
              <h2 className="section-h-title mb-4">Select Plan</h2>
              <RadioGroup>
                {plans.map(p => (
                  <label key={p.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                      planId === p.id
                        ? 'bg-[rgba(255,58,0,0.06)] border-[rgba(255,58,0,0.3)]'
                        : 'bg-[#0e1119] border-white/[0.06] hover:border-[rgba(255,58,0,0.15)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Radio
                        name="plan"
                        value={p.id}
                        checked={planId === p.id}
                        onChange={() => setPlanId(p.id)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">{p.label}</span>
                          {p.popular && <StatusBadge tone="cyan">Best Value</StatusBadge>}
                        </div>
                        <span className="text-[#9ca3af] text-xs">{p.slots} HWID slots included</span>
                      </div>
                    </div>
                    <span className="text-white font-bold">${(p.price / 100).toFixed(2)}</span>
                  </label>
                ))}
              </RadioGroup>
            </Card>

            {/* Coupon */}
            <Card className="p-5">
              <h2 className="section-h-title mb-4">Coupon Code</h2>
              <div className="flex gap-2">
                <Input placeholder="ONYX20" icon={<Tag size={13} />} value={coupon} onChange={e => setCoupon(e.target.value)} disabled={couponApplied} />
                <Button variant={couponApplied ? 'danger' : 'outline'} onClick={couponApplied ? () => { setCoupon(''); setCouponApplied(false) } : applyCoupon}>
                  {couponApplied ? 'Remove' : 'Apply'}
                </Button>
              </div>
              {couponApplied && (
                <div className="flex items-center gap-2 mt-2 text-[#5fcb88] text-xs">
                  <CheckCircle2 size={12} /> 10% discount applied
                </div>
              )}
            </Card>

            {/* Payment method */}
            <Card className="p-5">
              <h2 className="section-h-title mb-4">Payment Method</h2>
              <div className="flex gap-2 mb-4">
                {[
                  { id: 'wallet', icon: Wallet,     label: 'Wallet Balance' },
                  { id: 'card',   icon: CreditCard, label: 'Credit Card'    },
                ].map(m => {
                  const I = m.icon
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id as 'wallet' | 'card')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-all ${
                        method === m.id
                          ? 'bg-[rgba(255,58,0,0.06)] border-[rgba(255,58,0,0.3)] text-[#ff3a00]'
                          : 'bg-[#0e1119] border-white/[0.06] text-[#9ca3af] hover:border-white/[0.12]'
                      }`}
                    >
                      <I size={14} /> {m.label}
                    </button>
                  )
                })}
              </div>

              {method === 'wallet' ? (
                <div className="bg-[rgba(255,58,0,0.04)] border border-[rgba(255,58,0,0.1)] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">Wallet Balance</p>
                      <p className="text-[#9ca3af] text-xs">Available</p>
                    </div>
                    <p className="text-2xl font-bold text-[#ff3a00]">${(balance / 100).toFixed(2)}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0e1119] border border-white/[0.06] rounded-lg p-6 min-h-[120px] flex items-center justify-center">
                  <p className="text-[#9ca3af] text-sm">Stripe Payment Element renders here</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right: summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <Card className="p-5 flex flex-col gap-4">
                <h2 className="section-h-title">Order Summary</h2>

                <div className="flex items-center gap-3 p-3 bg-[#0e1119] rounded-lg border border-white/[0.04]">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(255,58,0,0.08)] border border-[rgba(255,58,0,0.15)] flex items-center justify-center shrink-0">
                    <Lock size={15} className="text-[#ff3a00]" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Onyx Rage</p>
                    <p className="text-[#9ca3af] text-xs">{plan.label} · {plan.slots} HWID</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#9ca3af]">
                    <span>Subtotal</span>
                    <span>${(plan.price / 100).toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-[#5fcb88]">
                      <span>Coupon (10%)</span>
                      <span>-${(discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="h-px bg-white/[0.06] my-2" />
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#ff3a00]">${(total / 100).toFixed(2)}</span>
                  </div>
                </div>

                <Button variant="primary" className="w-full !py-3.5 font-bold" icon={<ShieldCheck size={15} />} onClick={pay}>
                  {method === 'wallet' ? 'Pay with Wallet' : 'Pay with Card'}
                </Button>

                <div className="flex flex-col gap-2">
                  <FeatureBullet icon={<ShieldCheck size={11} strokeWidth={2} />} tone="cyan">
                    Secured by Stripe — 256-bit encryption
                  </FeatureBullet>
                  <FeatureBullet icon={<Zap size={11} strokeWidth={2.25} />} tone="success">
                    Instant license delivery
                  </FeatureBullet>
                  <FeatureBullet icon={<Link2 size={11} strokeWidth={2} />} tone="warn">
                    Personal download link — do not share
                  </FeatureBullet>
                  <FeatureBullet icon={<ShieldOff size={11} strokeWidth={2} />} tone="danger">
                    All purchases are non-refundable
                  </FeatureBullet>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
