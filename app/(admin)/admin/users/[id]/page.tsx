'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit2, Ban, ShieldOff, Key, Cpu, Wallet, Package, AlertTriangle, RefreshCw, Eye, Plus, Trash2, ShieldCheck, ShieldX } from 'lucide-react'
import { IconBadge } from '@/components/ui/FeatureBullet'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

const user = {
  id: 'darkbyte', username: 'DarkByte', email: 'dark@example.com',
  balance: 4250, tier: 'Gold', joined: 'May 1, 2026', status: 'active',
  flags: 0, discordId: '1234567890', totp: true, referralCode: 'ONYX-D4RK',
  lifetimeSpend: 5998,
  licenses: [
    { product: 'Onyx Rage',    key: 'ONYX-R4G3-XK2M-9P7Q', plan: '1 Month',  expires: 'Jun 3, 2026', status: 'active', hwid: '1/2' },
    { product: 'Onyx Stealth', key: 'ONYX-ST3L-KM9V-NB4X', plan: '3 Months', expires: 'Aug 1, 2026', status: 'active', hwid: '1/1' },
  ],
  recentOrders: [
    { id: 'ORD-042', product: 'Onyx Rage',    amount: '$9.99',  at: 'Jun 1, 2026', status: 'completed' },
    { id: 'ORD-031', product: 'Onyx Stealth', amount: '$24.99', at: 'May 1, 2026', status: 'completed' },
  ],
}

export default function UserDetailPage() {
  const { toast } = useToast()
  const [edit, setEdit] = useState(false)
  const [confirmBan, setConfirmBan] = useState(false)
  const [tier, setTier] = useState(user.tier)
  const [form, setForm] = useState({ username: user.username, email: user.email })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-[#9ca3af] hover:text-white text-sm mb-3">
            <ArrowLeft size={13} /> Back to Users
          </Link>
          <div className="flex items-center gap-3">
            <Avatar name={user.username} size="lg" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-white font-bold text-2xl tracking-tight">@{user.username}</h1>
                <StatusBadge tone="ok" dot>Active</StatusBadge>
                <span className="text-[#ffae50] font-bold text-sm">{user.tier}</span>
              </div>
              <p className="text-[#9ca3af] text-sm">{user.email} · Joined {user.joined}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant={edit ? 'primary' : 'outline'} size="sm" icon={<Edit2 size={13} />}
            onClick={() => { if (edit) toast({ title: 'Changes saved', variant: 'success' }); setEdit(e => !e) }}>
            {edit ? 'Save Changes' : 'Edit User'}
          </Button>
          <Button variant="danger" size="sm" icon={<Ban size={13} />} onClick={() => setConfirmBan(true)}>Ban User</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">

          <Card className="p-6">
            <h3 className="section-h-title mb-4 flex items-center gap-2"><Edit2 size={14} className="text-[#ff3a00]" /> Identity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} disabled={!edit} />
              <Input label="Email"    value={form.email}    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}    disabled={!edit} />
              {edit && (
                <>
                  <Input label="New Password" type="password" placeholder="Leave blank to keep current" />
                  <Select
                    label="Tier"
                    value={tier}
                    onChange={setTier}
                    options={['Onyx', 'Slate', 'Carbon', 'Diamond', 'Gold'].map(t => ({ value: t, label: t }))}
                  />
                </>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="section-h-title mb-4 flex items-center gap-2"><Wallet size={14} className="text-[#ff3a00]" /> Wallet</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#6b7280] text-xs uppercase tracking-wider font-semibold">Current Balance</p>
                <p className="text-3xl font-bold text-[#ff3a00]" style={{ letterSpacing: '-0.025em' }}>${(user.balance / 100).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[#6b7280] text-xs uppercase tracking-wider font-semibold">Lifetime Spend</p>
                <p className="text-xl font-bold text-white">${(user.lifetimeSpend / 100).toFixed(2)}</p>
              </div>
            </div>
            {edit && (
              <div className="flex gap-3 items-end">
                <Input label="Adjustment" placeholder="10.00" suffix="USD" className="flex-1" />
                <Select
                  value="add"
                  onChange={() => {}}
                  options={[{ value: 'add', label: 'Add' }, { value: 'sub', label: 'Subtract' }, { value: 'set', label: 'Set' }]}
                  className="w-32"
                />
                <Button variant="primary" onClick={() => toast({ title: 'Balance adjusted', variant: 'success' })}>Apply</Button>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="section-h">
              <h3 className="section-h-title flex items-center gap-2"><Key size={14} className="text-[#ff3a00]" /> Licenses</h3>
              <Button variant="outline" size="sm" icon={<Plus size={12} />}>Add License</Button>
            </div>
            <div className="flex flex-col gap-2">
              {user.licenses.map(l => (
                <div key={l.key} className="flex items-center gap-4 bg-[#0e1119] border border-white/[0.04] rounded-lg px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{l.product}</p>
                      <StatusBadge tone="ok" dot>Active</StatusBadge>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-[#9ca3af]">
                      <span>{l.plan}</span>
                      <span>Expires: {l.expires}</span>
                      <span>HWID: {l.hwid}</span>
                    </div>
                    <code className="text-[10px] font-mono text-[#6b7280] mt-1 block">{l.key}</code>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="btn btn-icon" title="Reset HWID"><Cpu size={12} /></button>
                    <button className="btn btn-icon" title="Edit"><Edit2 size={12} /></button>
                    <button className="btn btn-icon !text-[#ff5b75]" title="Revoke"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="section-h-title mb-4 flex items-center gap-2"><Package size={14} className="text-[#ff3a00]" /> Recent Orders</h3>
            <table className="table-onyx">
              <thead><tr><th>ID</th><th>Product</th><th>Date</th><th>Status</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {user.recentOrders.map(o => (
                  <tr key={o.id}>
                    <td className="font-mono text-[#ff3a00] text-xs">{o.id}</td>
                    <td className="text-white">{o.product}</td>
                    <td>{o.at}</td>
                    <td><StatusBadge tone="ok" dot>Completed</StatusBadge></td>
                    <td className="text-right font-bold text-white">{o.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="section-h-title mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Impersonate User',  icon: Eye,           variant: 'outline' as const },
                { label: 'Reset 2FA',         icon: ShieldOff,     variant: 'outline' as const },
                { label: 'Reset All HWIDs',   icon: RefreshCw,     variant: 'outline' as const },
                { label: 'Kill All Sessions', icon: Cpu,           variant: 'outline' as const },
                { label: 'Warn User',         icon: AlertTriangle, variant: 'outline' as const },
                { label: 'Suspend 7 Days',    icon: Ban,           variant: 'danger'  as const },
              ].map(a => (
                <Button key={a.label} variant={a.variant} size="sm" icon={<a.icon size={12} />}
                  className="!justify-start"
                  onClick={() => toast({ title: a.label, description: 'Action triggered.', variant: 'info' })}>
                  {a.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="section-h-title mb-4">Account Info</h3>
            <div className="space-y-2.5 text-sm">
              {([
                { label: 'Referral Code', value: <span className="font-mono">{user.referralCode}</span> },
                { label: 'Discord ID',    value: <span className="font-mono">{user.discordId}</span>    },
                { label: '2FA',           value: user.totp
                  ? <IconBadge tone="success" icon={<ShieldCheck size={11} strokeWidth={2.5} />} label="Enabled"  />
                  : <IconBadge tone="danger"  icon={<ShieldX     size={11} strokeWidth={2.5} />} label="Disabled" />
                },
                { label: 'Tier',          value: <span style={{ color: '#ffae50' }}>{user.tier}</span> },
                { label: 'Flags',         value: <span>{user.flags} active</span> },
              ]).map(i => (
                <div key={i.label} className="flex justify-between items-center">
                  <span className="text-[#9ca3af] text-xs">{i.label}</span>
                  <span className="text-xs font-semibold text-[#d4d4d8]">{i.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="section-h-title mb-3">Admin Notes</h3>
            <Textarea rows={4} placeholder="Internal notes only..." />
            <Button variant="outline" size="sm" className="w-full mt-2">Save Note</Button>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmBan}
        onClose={() => setConfirmBan(false)}
        title="Ban this user?"
        description="This will permanently ban their account, revoke all licenses, and kill active sessions."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmBan(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { setConfirmBan(false); toast({ title: 'User banned', variant: 'success' }) }}>Confirm Ban</Button>
          </>
        }
      >
        <Textarea label="Reason (required)" rows={3} placeholder="Account sharing, leaked tool, etc..." />
      </Modal>
    </div>
  )
}
