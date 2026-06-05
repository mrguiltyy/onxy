'use client'
import { useState } from 'react'
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, CreditCard } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'

const txns = [
  { id: 1, type: 'deposit',  desc: 'Wallet top-up via Stripe',           amount: 2500,  date: 'Jun 1, 2026' },
  { id: 2, type: 'purchase', desc: 'Onyx Rage — 1 Month Access',         amount: -999,  date: 'Jun 1, 2026' },
  { id: 3, type: 'referral', desc: 'Referral reward — DarkByte joined',  amount: 100,   date: 'May 28, 2026' },
  { id: 4, type: 'purchase', desc: 'Onyx Core — Lifetime Access',        amount: -4999, date: 'Apr 12, 2026' },
  { id: 5, type: 'deposit',  desc: 'Wallet top-up via Stripe',           amount: 10000, date: 'Apr 12, 2026' },
  { id: 6, type: 'purchase', desc: 'Onyx Stealth — 1 Month Access',      amount: -1499, date: 'May 19, 2026' },
]

const amounts = [500, 1000, 2500, 5000, 10000, 25000]

export default function WalletPage() {
  const { toast } = useToast()
  const [custom, setCustom] = useState('')
  const [selected, setSelected] = useState<number | null>(2500)
  const [showCheckout, setShowCheckout] = useState(false)
  const [method, setMethod] = useState('card')

  const handleTopup = () => {
    setShowCheckout(false)
    toast({ title: 'Redirecting to Stripe', description: 'Complete payment to add funds.', variant: 'info' })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl tracking-tight">Wallet</h1>
        <p className="text-[#9ca3af] text-sm mt-1">Manage your balance and view transaction history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Balance */}
        <Card className="lg:col-span-1 p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,58,0,0.08) 0%, rgba(255,58,0,0.02) 100%)', border: '1px solid rgba(255,58,0,0.2)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px]" style={{ background: 'rgba(255,58,0,0.1)', transform: 'translate(20px, -20px)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[rgba(255,58,0,0.15)] border border-[rgba(255,58,0,0.25)] flex items-center justify-center">
                <Wallet size={16} className="text-[#ff3a00]" />
              </div>
              <span className="text-[#9ca3af] text-sm font-medium">Available Balance</span>
            </div>
            <p className="text-4xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>$142.50</p>
            <p className="text-[#9ca3af] text-xs">Ready to spend on any tool</p>
          </div>
        </Card>

        {/* Top up */}
        <Card className="lg:col-span-2 p-6">
          <div className="section-h">
            <h3 className="section-h-title flex items-center gap-2"><Plus size={15} className="text-[#ff3a00]" /> Top Up Wallet</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {amounts.map(a => (
              <button
                key={a}
                onClick={() => { setSelected(a); setCustom('') }}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all border ${
                  selected === a
                    ? 'bg-[rgba(255,58,0,0.08)] border-[rgba(255,58,0,0.3)] text-[#ff3a00]'
                    : 'bg-[#0e1119] border-white/[0.06] text-[#9ca3af] hover:border-[rgba(255,58,0,0.2)] hover:text-white'
                }`}
              >
                ${(a / 100).toFixed(0)}
              </button>
            ))}
          </div>
          <Input
            label="Custom amount"
            placeholder="e.g. 15.00"
            type="number"
            min="1"
            suffix="USD"
            value={custom}
            onChange={e => { setCustom(e.target.value); setSelected(null) }}
          />
          <Button variant="primary" className="w-full mt-4 py-3" onClick={() => setShowCheckout(true)}>
            Add Funds
          </Button>
        </Card>
      </div>

      {/* History */}
      <Card className="p-6">
        <div className="section-h">
          <h3 className="section-h-title">Transaction History</h3>
          <span className="status status-mute">{txns.length} entries</span>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="table-onyx">
            <thead>
              <tr>
                <th className="!pl-6">Type</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right !pr-6">Amount</th>
              </tr>
            </thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.id}>
                  <td className="!pl-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        t.type === 'deposit' || t.type === 'referral' ? 'bg-[rgba(95,203,136,0.1)]' : 'bg-[rgba(255,91,117,0.1)]'
                      }`}>
                        {t.type === 'deposit' || t.type === 'referral'
                          ? <ArrowDownLeft size={11} className="text-[#5fcb88]" />
                          : <ArrowUpRight size={11} className="text-[#ff5b75]" />}
                      </div>
                      <span className="capitalize text-white text-xs font-semibold">{t.type}</span>
                    </div>
                  </td>
                  <td className="text-white">{t.desc}</td>
                  <td>{t.date}</td>
                  <td><StatusBadge tone="ok" dot>Completed</StatusBadge></td>
                  <td className="text-right !pr-6">
                    <span className={`font-bold ${t.amount > 0 ? 'text-[#5fcb88]' : 'text-[#ff5b75]'}`}>
                      {t.amount > 0 ? '+' : ''}${(Math.abs(t.amount) / 100).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Choose payment method"
        description={`Adding $${(selected ? selected / 100 : Number(custom) || 0).toFixed(2)} to your wallet`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCheckout(false)}>Cancel</Button>
            <Button variant="primary" icon={<CreditCard size={14} />} onClick={handleTopup}>Continue to Stripe</Button>
          </>
        }
      >
        <Select
          label="Payment Method"
          value={method}
          onChange={setMethod}
          options={[
            { value: 'card',   label: 'Credit / Debit Card' },
            { value: 'crypto', label: 'Crypto (BTC / LTC / USDT)' },
          ]}
        />
      </Modal>
    </div>
  )
}
