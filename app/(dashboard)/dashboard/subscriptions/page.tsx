'use client'
import { useState } from 'react'
import { CreditCard, RefreshCw, Calendar, AlertCircle, X, Package } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'

interface Sub {
  id:            string
  productName:   string
  planLabel:     string
  amountCents:   number
  intervalLabel: string
  nextBilling:   string
  autoRenew:     boolean
  paymentMethod: string
  status:        'active' | 'cancelled' | 'past_due'
}

const initialSubs: Sub[] = [
  { id: '1', productName: 'Onyx Rage',    planLabel: '1 Month',  amountCents:  999, intervalLabel: 'Monthly',   nextBilling: 'Jun 28, 2026', autoRenew: true,  paymentMethod: 'Wallet Balance', status: 'active' },
  { id: '2', productName: 'Onyx Stealth', planLabel: '3 Months', amountCents: 3499, intervalLabel: 'Quarterly', nextBilling: 'Aug 19, 2026', autoRenew: true,  paymentMethod: 'Visa •••• 4242', status: 'active' },
  { id: '3', productName: 'Onyx Apex',    planLabel: '1 Month',  amountCents: 2999, intervalLabel: 'Monthly',   nextBilling: 'Jun 12, 2026', autoRenew: false, paymentMethod: 'Wallet Balance', status: 'active' },
]

export default function SubscriptionsPage() {
  const { toast } = useToast()
  const [subs, setSubs] = useState(initialSubs)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const toggleRenew = (id: string) => {
    setSubs(subs.map(s => s.id === id ? { ...s, autoRenew: !s.autoRenew } : s))
    const s = subs.find(s => s.id === id)!
    toast({
      title: s.autoRenew ? 'Auto-renew disabled' : 'Auto-renew enabled',
      description: s.autoRenew ? `${s.productName} will expire on ${s.nextBilling}` : `${s.productName} will renew automatically.`,
      variant: 'success',
    })
  }

  const confirmCancel = () => {
    setSubs(subs.map(s => s.id === cancelling ? { ...s, status: 'cancelled', autoRenew: false } : s))
    setCancelling(null)
    toast({ title: 'Subscription cancelled', description: 'Access continues until expiry.', variant: 'success' })
  }

  const monthlyTotal = subs.filter(s => s.status === 'active' && s.autoRenew).reduce((t, s) => {
    if (s.intervalLabel === 'Monthly')  return t + s.amountCents
    if (s.intervalLabel === 'Quarterly') return t + Math.round(s.amountCents / 3)
    return t
  }, 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl tracking-tight">Subscriptions</h1>
        <p className="text-[#9ca3af] text-sm mt-1">Manage your recurring tool access.</p>
      </div>

      {/* Top summary */}
      <Card className="p-6 mb-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,58,0,0.06) 0%, rgba(20,24,35,0.95) 60%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[60px] pointer-events-none" style={{ background: 'rgba(255,58,0,0.08)', transform: 'translate(40px, -40px)' }} />
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold mb-1">Active subscriptions</p>
            <p className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.025em' }}>{subs.filter(s => s.status === 'active').length}</p>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold mb-1">Equivalent monthly cost</p>
            <p className="text-3xl font-bold text-[#ff3a00]" style={{ letterSpacing: '-0.025em' }}>${(monthlyTotal / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold mb-1">Next billing</p>
            <p className="text-base font-bold text-white">{subs.filter(s => s.autoRenew)[0]?.nextBilling ?? 'No upcoming renewals'}</p>
          </div>
        </div>
      </Card>

      {/* Sub list */}
      <div className="flex flex-col gap-4">
        {subs.map(s => (
          <Card key={s.id} className="p-5">

            {/* Top row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(255,58,0,0.08)] border border-[rgba(255,58,0,0.15)] flex items-center justify-center">
                  <Package size={16} className="text-[#ff3a00]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold">{s.productName}</h3>
                    <StatusBadge tone={s.status === 'active' ? 'ok' : s.status === 'cancelled' ? 'mute' : 'bad'} dot>
                      {s.status === 'past_due' ? 'Past Due' : s.status === 'cancelled' ? 'Cancelled' : 'Active'}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-[#9ca3af]">{s.planLabel} · {s.intervalLabel}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>${(s.amountCents / 100).toFixed(2)}</p>
                <p className="text-[10px] text-[#6b7280]">per {s.intervalLabel.toLowerCase()}</p>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <div className="bg-[#0e1119] border border-white/[0.04] rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={10} className="text-[#6b7280]" />
                  <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">Next billing</p>
                </div>
                <p className="text-white text-xs font-semibold">{s.nextBilling}</p>
              </div>
              <div className="bg-[#0e1119] border border-white/[0.04] rounded-md p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CreditCard size={10} className="text-[#6b7280]" />
                  <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">Payment</p>
                </div>
                <p className="text-white text-xs font-semibold">{s.paymentMethod}</p>
              </div>
              <div className="bg-[#0e1119] border border-white/[0.04] rounded-md p-3 sm:col-span-1 col-span-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <RefreshCw size={10} className="text-[#6b7280]" />
                  <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">Status</p>
                </div>
                <p className={`text-xs font-semibold ${s.autoRenew ? 'text-[#5fcb88]' : 'text-[#ffae50]'}`}>
                  {s.autoRenew ? 'Auto-renew on' : 'Will not renew'}
                </p>
              </div>
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/[0.04]">
              <Switch
                checked={s.autoRenew && s.status === 'active'}
                onChange={() => toggleRenew(s.id)}
                disabled={s.status !== 'active'}
                label="Auto-renew"
                description={s.autoRenew ? 'Will charge automatically' : 'Will expire at end of period'}
              />
              {s.status === 'active' && (
                <Button variant="danger" size="sm" icon={<X size={12} />} onClick={() => setCancelling(s.id)}>
                  Cancel
                </Button>
              )}
            </div>
          </Card>
        ))}

        {subs.length === 0 && (
          <EmptyState
            icon={<RefreshCw size={20} />}
            title="No active subscriptions"
            description="When you buy a recurring plan, manage it here."
          />
        )}
      </div>

      {/* Cancel modal */}
      <Modal
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title="Cancel subscription?"
        description="You'll keep access until the current period ends. We won't bill again."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelling(null)}>Keep Subscription</Button>
            <Button variant="danger" onClick={confirmCancel}>Cancel Subscription</Button>
          </>
        }
      >
        <div className="p-4 rounded-lg bg-[rgba(255,174,80,0.05)] border border-[rgba(255,174,80,0.15)] flex items-start gap-3">
          <AlertCircle size={14} className="text-[#ffae50] mt-0.5 shrink-0" />
          <p className="text-xs text-[#d4d4d8] leading-relaxed">
            Cancelling stops future charges. Your license will work until expiry, then be marked inactive.
            You can re-subscribe at any time.
          </p>
        </div>
      </Modal>
    </div>
  )
}
