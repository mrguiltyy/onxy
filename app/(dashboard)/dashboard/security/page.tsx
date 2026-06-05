'use client'
import { Cpu, Globe, Monitor, Shield, Trash2, ShieldCheck, AlertTriangle, KeyRound } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/Toast'

const hwids = [
  { id: 1, hash: 'a3f7c9...d2e1b8', label: 'Main PC', registeredAt: 'May 3, 2026',  lastSeen: '2h ago', ip: '91.xxx.xxx.12', active: true  },
  { id: 2, hash: 'b8e2a1...f4c7d9', label: 'Laptop',  registeredAt: 'May 15, 2026', lastSeen: '3d ago', ip: '91.xxx.xxx.44', active: false },
]

const sessions = [
  { id: 1, tool: 'Onyx Rage',    ip: '91.xxx.xxx.12', country: 'US', device: 'Main PC', started: '2h ago', active: true  },
  { id: 2, tool: 'Onyx Stealth', ip: '91.xxx.xxx.12', country: 'US', device: 'Main PC', started: '1d ago', active: false },
]

const ipLog = [
  { ip: '91.xxx.xxx.12', country: 'US', event: 'Login',     time: '2h ago', vpn: false },
  { ip: '91.xxx.xxx.12', country: 'US', event: 'Tool Auth', time: '2h ago', vpn: false },
  { ip: '91.xxx.xxx.12', country: 'US', event: 'Download',  time: '3d ago', vpn: false },
  { ip: '91.xxx.xxx.44', country: 'US', event: 'Login',     time: '5d ago', vpn: true  },
]

export default function SecurityPage() {
  const { toast } = useToast()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl tracking-tight">Security</h1>
        <p className="text-[#9ca3af] text-sm mt-1">Manage your devices, sessions, and access.</p>
      </div>

      {/* Account security toggles */}
      <Card className="p-6 mb-5">
        <div className="section-h">
          <h3 className="section-h-title flex items-center gap-2"><KeyRound size={15} className="text-[#ff3a00]" /> Account Security</h3>
        </div>
        <div className="flex flex-col gap-4">
          <Switch defaultChecked label="Two-factor authentication"  description="Require a 6-digit code in addition to your password." />
          <Switch defaultChecked label="Login notifications"        description="Get an email whenever your account is signed into." />
          <Switch                label="Block VPN/proxy logins"     description="Reject logins from known VPN or proxy IPs." />
        </div>
      </Card>

      {/* HWIDs */}
      <Card className="p-6 mb-5">
        <div className="section-h">
          <h3 className="section-h-title flex items-center gap-2"><Cpu size={15} className="text-[#ff3a00]" /> Registered Devices</h3>
          <span className="status status-mute">{hwids.length} devices</span>
        </div>
        <div className="flex flex-col gap-3">
          {hwids.map(h => (
            <div key={h.id} className="flex items-center gap-4 bg-[#0e1119] border border-white/[0.04] rounded-lg px-4 py-3.5">
              <div className="w-9 h-9 rounded-lg bg-[rgba(255,58,0,0.08)] border border-[rgba(255,58,0,0.15)] flex items-center justify-center shrink-0">
                <Monitor size={15} className="text-[#ff3a00]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm">{h.label}</p>
                  {h.active && <StatusBadge tone="ok" dot>Active now</StatusBadge>}
                </div>
                <div className="flex flex-wrap gap-3 mt-0.5">
                  <span className="text-[10px] text-[#9ca3af] font-mono">HWID: {h.hash}</span>
                  <span className="text-[10px] text-[#9ca3af]">Last IP: {h.ip}</span>
                  <span className="text-[10px] text-[#9ca3af]">Last seen: {h.lastSeen}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} className="!text-[#ff5b75]"
                onClick={() => toast({ title: 'Device removed', description: 'Removed device from your account.', variant: 'success' })}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Sessions */}
      <Card className="p-6 mb-5">
        <div className="section-h">
          <h3 className="section-h-title flex items-center gap-2"><Shield size={15} className="text-[#ff5b75]" /> Tool Sessions</h3>
          <Button variant="danger" size="sm" onClick={() => toast({ title: 'All sessions terminated', variant: 'success' })}>
            Kill All Sessions
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center gap-4 bg-[#0e1119] border border-white/[0.04] rounded-lg px-4 py-3.5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm">{s.tool}</p>
                  {s.active ? <StatusBadge tone="ok" dot>Active</StatusBadge> : <StatusBadge tone="mute">Ended</StatusBadge>}
                </div>
                <div className="flex flex-wrap gap-3 mt-0.5 text-[10px] text-[#9ca3af]">
                  <span>Device: {s.device}</span>
                  <span>IP: {s.ip}</span>
                  <span>Country: {s.country}</span>
                  <span>Started: {s.started}</span>
                </div>
              </div>
              {s.active && <Button variant="danger" size="sm">Kill</Button>}
            </div>
          ))}
        </div>
      </Card>

      {/* IP log */}
      <Card className="p-6">
        <div className="section-h">
          <h3 className="section-h-title flex items-center gap-2"><Globe size={15} className="text-[#ffae50]" /> Activity Log</h3>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="table-onyx">
            <thead>
              <tr>
                <th className="!pl-6">IP Address</th>
                <th>Country</th>
                <th>Event</th>
                <th>Time</th>
                <th className="!pr-6">VPN</th>
              </tr>
            </thead>
            <tbody>
              {ipLog.map((l, i) => (
                <tr key={i}>
                  <td className="font-mono text-white !pl-6">{l.ip}</td>
                  <td>{l.country}</td>
                  <td>
                    <span className={`font-semibold ${l.event === 'Login' ? 'text-[#ff3a00]' : l.event === 'Download' ? 'text-[#5fcb88]' : 'text-[#d4d4d8]'}`}>
                      {l.event}
                    </span>
                  </td>
                  <td>{l.time}</td>
                  <td className="!pr-6">
                    {l.vpn
                      ? <span className="flex items-center gap-1.5 text-[#ffae50] text-xs font-semibold"><AlertTriangle size={11} /> VPN</span>
                      : <span className="flex items-center gap-1.5 text-[#5fcb88] text-xs font-semibold"><ShieldCheck size={11} /> Clean</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
