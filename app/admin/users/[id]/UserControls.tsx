'use client'
import { useState, useTransition } from 'react'
import { Crown, Store, User as UserIcon, ShieldCheck, Wallet, KeyRound, Ban, Pause, Play, Loader2, Check, AlertTriangle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { adminCreditUser, adminChangeRole, adminSetStatus, adminResetPassword } from './actions'

interface Props {
  userId:        string
  username:      string
  role:          string
  status:        string
  balanceCents:  number
}

export function UserControls({ userId, username, role, status, balanceCents }: Props) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // Credit / debit
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  function flash(kind: 'ok' | 'err', text: string) {
    setMsg({ kind, text })
    setTimeout(() => setMsg(null), 4000)
  }

  function doCredit() {
    const dollars = parseFloat(amount)
    if (Number.isNaN(dollars) || dollars === 0) return flash('err', 'Enter a non-zero amount.')
    if (!reason.trim()) return flash('err', 'Reason required.')
    const cents = Math.round(dollars * 100)
    start(async () => {
      const r = await adminCreditUser(userId, cents, reason)
      if (r.ok) { flash('ok', `${cents >= 0 ? 'Credited' : 'Debited'} ${formatPrice(Math.abs(cents))}.`); setAmount(''); setReason('') }
      else flash('err', r.error ?? 'Failed.')
    })
  }

  function doRole(newRole: 'user'|'reseller'|'support'|'super_admin') {
    start(async () => {
      const r = await adminChangeRole(userId, newRole)
      if (r.ok) flash('ok', `Role set to ${newRole}.`)
      else flash('err', r.error ?? 'Failed.')
    })
  }

  function doStatus(newStatus: 'active'|'suspended'|'banned') {
    let reason = ''
    if (newStatus !== 'active') {
      reason = prompt(`Reason for ${newStatus === 'banned' ? 'banning' : 'suspending'} ${username}?`) ?? ''
      if (!reason) return
    }
    start(async () => {
      const r = await adminSetStatus(userId, newStatus, reason)
      if (r.ok) flash('ok', `User set to ${newStatus}.`)
      else flash('err', r.error ?? 'Failed.')
    })
  }

  function doResetPw() {
    if (!confirm(`Send password reset email to ${username}?`)) return
    start(async () => {
      const r = await adminResetPassword('')  // would need email passed — TODO
      if (r.ok) flash('ok', 'Reset email sent.')
      else flash('err', r.error ?? 'Failed.')
    })
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="card p-5">
        <p className="label-mono mb-3">Status</p>
        <div className="flex flex-col gap-2">
          {status !== 'active' && (
            <button onClick={() => doStatus('active')} disabled={pending} className="btn btn-secondary btn-sm justify-start w-full">
              <Play size={12} /> Reactivate
            </button>
          )}
          {status === 'active' && (
            <button onClick={() => doStatus('suspended')} disabled={pending} className="btn btn-sm justify-start w-full"
              style={{ background: 'rgba(250,204,21,0.08)', color: 'var(--warn)', border: '1px solid rgba(250,204,21,0.25)' }}>
              <Pause size={12} /> Suspend account
            </button>
          )}
          {status !== 'banned' && (
            <button onClick={() => doStatus('banned')} disabled={pending} className="btn btn-sm justify-start w-full"
              style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--bad)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Ban size={12} /> Ban account
            </button>
          )}
        </div>
      </div>

      {/* Role */}
      <div className="card p-5">
        <p className="label-mono mb-3">Role</p>
        <p className="text-[11.5px] text-[var(--fg-mute)] mb-3">Current: <span className="font-semibold capitalize">{role}</span></p>
        <div className="grid grid-cols-2 gap-2">
          <RoleButton onClick={() => doRole('user')}        active={role === 'user'}        icon={<UserIcon size={11} />} label="User" disabled={pending} />
          <RoleButton onClick={() => doRole('reseller')}    active={role === 'reseller'}    icon={<Store size={11} />}    label="Reseller" disabled={pending} />
          <RoleButton onClick={() => doRole('support')}     active={role === 'support'}     icon={<ShieldCheck size={11} />} label="Support" disabled={pending} />
          <RoleButton onClick={() => doRole('super_admin')} active={role === 'super_admin'} icon={<Crown size={11} />}    label="Admin" disabled={pending} accent />
        </div>
      </div>

      {/* Credit/debit */}
      <div className="card p-5">
        <p className="label-mono mb-3">Wallet — current {formatPrice(balanceCents)}</p>
        <div className="space-y-2">
          <div>
            <label className="form-label">Amount ($)</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 10 or -5"
              className="form-input tabular-nums" disabled={pending} />
            <p className="text-[10.5px] text-[var(--fg-mute)] mt-1">Use negative number to debit.</p>
          </div>
          <div>
            <label className="form-label">Reason</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Refund for ticket #42"
              className="form-input" disabled={pending} />
          </div>
          <button onClick={doCredit} disabled={pending || !amount || !reason} className="btn btn-primary btn-sm w-full">
            {pending ? <Loader2 size={12} className="animate-spin" /> : <><Wallet size={12} /> Apply</>}
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-md px-3 py-2 text-[12.5px] flex items-start gap-2" style={{
          background: msg.kind === 'ok' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${msg.kind === 'ok' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          color: msg.kind === 'ok' ? 'var(--ok)' : 'var(--bad)',
        }}>
          {msg.kind === 'ok' ? <Check size={13} className="mt-0.5 shrink-0" /> : <AlertTriangle size={13} className="mt-0.5 shrink-0" />}
          {msg.text}
        </div>
      )}
    </div>
  )
}

function RoleButton({ onClick, active, icon, label, disabled, accent }: { onClick: () => void; active: boolean; icon: React.ReactNode; label: string; disabled?: boolean; accent?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled || active} className="btn btn-sm justify-start"
      style={active
        ? { background: accent ? 'var(--brand-gradient)' : 'var(--brand-faint)', color: accent ? '#3a2630' : 'var(--brand)', border: 'none' }
        : { background: 'var(--surface-2)', color: 'var(--fg-dim)', border: '1px solid var(--hairline)' }}>
      {icon} {label}
    </button>
  )
}
