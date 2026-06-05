import { ClipboardList, Shield, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'

const logs = [
  { id: 1, admin: 'You',     action: 'REVOKE_LICENSE',  target: 'User: ZeroFrost',    detail: 'License ONYX-ZF01 revoked for policy violation', at: '2h ago', severity: 'high' },
  { id: 2, admin: 'You',     action: 'BAN_USER',        target: 'User: ghost_exe',    detail: 'Permanent ban. Reason: account sharing',         at: '3h ago', severity: 'high' },
  { id: 3, admin: 'You',     action: 'ADJUST_BALANCE',  target: 'User: DarkByte',     detail: 'Added $10.00 to wallet. Reason: manual credit',  at: '5h ago', severity: 'low'  },
  { id: 4, admin: 'You',     action: 'PUBLISH_PRODUCT', target: 'Product: Onyx Apex', detail: 'Version v1.0.3 published. Force update: true',  at: '1d ago', severity: 'medium' },
  { id: 5, admin: 'Support', action: 'RESET_HWID',      target: 'User: NxGhost',      detail: 'HWID reset for license ONYX-NX01 on request',    at: '1d ago', severity: 'low'  },
  { id: 6, admin: 'You',     action: 'CREATE_COUPON',   target: 'Coupon: LAUNCH20',   detail: '20% off all products, 100 uses, expires Jun 30', at: '2d ago', severity: 'low'  },
  { id: 7, admin: 'You',     action: 'DELETE_PRODUCT',  target: 'Product: Onyx Beta', detail: 'Product permanently archived and removed',       at: '3d ago', severity: 'high' },
  { id: 8, admin: 'You',     action: 'ANNOUNCE',        target: 'Global',             detail: 'Pushed maintenance announcement to all users',   at: '4d ago', severity: 'low'  },
]

const actionColors: Record<string, string> = {
  BAN_USER:        '#ff5b75',
  REVOKE_LICENSE:  '#ff5b75',
  ADJUST_BALANCE:  '#ff3a00',
  PUBLISH_PRODUCT: '#5fcb88',
  RESET_HWID:      '#ffae50',
  CREATE_COUPON:   '#ff5b75',
  DELETE_PRODUCT:  '#ff5b75',
  ANNOUNCE:        '#5b8def',
}

export default function AuditLogPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Audit Log</h1>
          <p className="text-[#9ca3af] text-sm mt-1">Immutable record of all admin actions.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <Shield size={13} className="text-[#ff3a00]" /> Tamper-proof
        </div>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
        <input type="search" placeholder="Search actions, targets..." className="input-onyx pl-9" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-onyx">
            <thead>
              <tr>
                <th>Action</th>
                <th>Admin</th>
                <th>Target</th>
                <th>Detail</th>
                <th>When</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td>
                    <code className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md"
                      style={{ color: actionColors[l.action], background: `${actionColors[l.action]}15` }}>
                      {l.action}
                    </code>
                  </td>
                  <td className="text-white font-semibold">{l.admin}</td>
                  <td className="text-[#d4d4d8] text-xs">{l.target}</td>
                  <td className="text-[#9ca3af] text-xs max-w-xs truncate">{l.detail}</td>
                  <td className="text-xs">{l.at}</td>
                  <td>
                    <StatusBadge tone={l.severity === 'high' ? 'bad' : l.severity === 'medium' ? 'warn' : 'mute'}>
                      {l.severity}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[10px] text-[#4b5563] text-center mt-4">
        All actions are permanently recorded with admin identity, timestamp, and IP. Cannot be edited or deleted.
      </p>
    </div>
  )
}
