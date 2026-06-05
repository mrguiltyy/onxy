'use client'
import { Gift, Copy, TrendingUp, Users, DollarSign, Share2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { EmptyState } from '@/components/ui/EmptyState'

const referrals = [
  { username: 'DarkByte', joinedAt: 'May 28, 2026', spent: '$9.99',  earned: '$1.00', status: 'active' },
  { username: 'ShadowFx', joinedAt: 'Apr 15, 2026', spent: '$59.98', earned: '$6.00', status: 'active' },
  { username: 'NxGhost',  joinedAt: 'Mar 2, 2026',  spent: '$49.99', earned: '$5.00', status: 'active' },
]

export default function ReferralsPage() {
  const { toast } = useToast()
  const code = 'ONYX-X7K2'
  const link = `https://onyx.gg/ref/${code}`

  const copy = (text: string, what: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: `${what} copied`, variant: 'success' })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl tracking-tight">Referrals</h1>
        <p className="text-[#9ca3af] text-sm mt-1">Earn wallet credit for every person you bring in.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Users,      label: 'Total Referrals', value: '3',     color: '#ff3a00' },
          { icon: DollarSign, label: 'Total Earned',    value: '$18.00', color: '#5fcb88' },
          { icon: TrendingUp, label: 'Pending Rewards', value: '$0.00',  color: '#ff5b75' },
        ].map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} hover="cyan" className="p-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <Icon size={15} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mt-0.5 font-semibold">{s.label}</p>
            </Card>
          )
        })}
      </div>

      {/* Code card */}
      <Card className="p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Gift size={15} className="text-[#ff3a00]" />
          <h3 className="section-h-title">Your Referral Code</h3>
          <StatusBadge tone="cyan">10% reward</StatusBadge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold mb-2">Code</p>
            <div className="flex items-center gap-2 bg-[#06080d] border border-[rgba(255,58,0,0.15)] rounded-lg px-4 py-3">
              <code className="font-mono text-[#ff3a00] font-bold tracking-widest flex-1">{code}</code>
              <Button variant="ghost" size="sm" icon={<Copy size={12} />} onClick={() => copy(code, 'Code')}>Copy</Button>
            </div>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-wider text-[#6b7280] font-semibold mb-2">Referral Link</p>
            <div className="flex items-center gap-2 bg-[#06080d] border border-white/[0.05] rounded-lg px-4 py-3">
              <span className="font-mono text-[#9ca3af] text-xs flex-1 truncate">{link}</span>
              <Button variant="ghost" size="sm" icon={<Share2 size={12} />} onClick={() => copy(link, 'Link')}>Share</Button>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[rgba(255,58,0,0.04)] border border-[rgba(255,58,0,0.1)]">
          <p className="text-[#9ca3af] text-[13px] leading-relaxed">
            <span className="text-[#ff3a00] font-semibold">How it works:</span> When someone signs up with your code and makes their first purchase,
            you earn <span className="text-white font-semibold">10%</span> of their purchase value as wallet credit. Instant. No cap.
          </p>
        </div>
      </Card>

      {/* List */}
      <Card className="p-6">
        <div className="section-h">
          <h3 className="section-h-title">Your Referrals</h3>
        </div>
        {referrals.length > 0 ? (
          <div className="overflow-x-auto -mx-6">
            <table className="table-onyx">
              <thead>
                <tr>
                  <th className="!pl-6">User</th>
                  <th>Joined</th>
                  <th>Total Spent</th>
                  <th>You Earned</th>
                  <th className="!pr-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.username}>
                    <td className="!pl-6">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.username} size="sm" />
                        <span className="text-white font-semibold">@{r.username}</span>
                      </div>
                    </td>
                    <td>{r.joinedAt}</td>
                    <td className="text-white">{r.spent}</td>
                    <td className="text-[#5fcb88] font-bold">{r.earned}</td>
                    <td className="!pr-6"><StatusBadge tone="ok" dot>Active</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Gift size={20} />} title="No referrals yet" description="Share your code to start earning." />
        )}
      </Card>
    </div>
  )
}
