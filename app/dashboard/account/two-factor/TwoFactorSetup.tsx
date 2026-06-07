'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Copy, Loader2, ShieldCheck, AlertTriangle, KeyRound, X, Lock } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { setTwoFactorFlag } from './actions'

interface Props {
  enabled:          boolean
  username:         string
  existingFactorId: string | null
}

type Stage = 'idle' | 'enrolling' | 'showing_qr' | 'verifying' | 'enabled' | 'disabling'

interface EnrollData {
  factorId: string
  qrCode:   string         // SVG string or data URL
  secret:   string         // base32 TOTP secret
  uri:      string         // otpauth://... URI
}

export function TwoFactorSetup({ enabled: initialEnabled, username, existingFactorId }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [stage, setStage] = useState<Stage>(enabled ? 'enabled' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const [enroll, setEnroll] = useState<EnrollData | null>(null)
  const [code, setCode] = useState('')
  const [pending, start] = useTransition()
  const [copied, setCopied] = useState(false)

  async function startEnroll() {
    setError(null)
    setStage('enrolling')
    try {
      const supabase = supabaseBrowser()

      // Clean up any unverified factors first (Supabase only allows one TOTP at a time)
      const { data: existing } = await supabase.auth.mfa.listFactors()
      for (const f of existing?.totp ?? []) {
        if (f.status !== 'verified') {
          await supabase.auth.mfa.unenroll({ factorId: f.id })
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType:   'totp',
        friendlyName: `OP · ${username}`,
        issuer:       'OP',
      })
      if (error || !data) { setError(error?.message ?? 'Could not start enrollment.'); setStage('idle'); return }

      setEnroll({
        factorId: data.id,
        qrCode:   data.totp.qr_code,
        secret:   data.totp.secret,
        uri:      data.totp.uri,
      })
      setStage('showing_qr')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setStage('idle')
    }
  }

  async function verifyAndEnable() {
    if (!enroll) return
    if (code.length !== 6) { setError('Code must be 6 digits.'); return }
    setError(null)
    setStage('verifying')
    try {
      const supabase = supabaseBrowser()
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enroll.factorId })
      if (cErr || !challenge) { setError(cErr?.message ?? 'Could not start challenge.'); setStage('showing_qr'); return }

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId:    enroll.factorId,
        challengeId: challenge.id,
        code,
      })
      if (vErr) { setError(vErr.message); setStage('showing_qr'); return }

      // Mark profile.two_factor_enabled = true
      start(async () => {
        await setTwoFactorFlag(true)
        setEnabled(true)
        setStage('enabled')
        setEnroll(null)
        setCode('')
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setStage('showing_qr')
    }
  }

  async function disable() {
    if (!confirm('Disable two-factor authentication? Your account will be less secure.')) return
    setError(null)
    setStage('disabling')
    try {
      const supabase = supabaseBrowser()
      if (existingFactorId) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: existingFactorId })
        if (error) { setError(error.message); setStage('enabled'); return }
      }
      start(async () => {
        await setTwoFactorFlag(false)
        setEnabled(false)
        setStage('idle')
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setStage('enabled')
    }
  }

  async function copySecret() {
    if (!enroll?.secret) return
    await navigator.clipboard.writeText(enroll.secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ── Enabled state ──
  if (enabled && stage === 'enabled') {
    return (
      <div>
        <div className="card p-5 mb-4" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
              style={{ background: 'var(--ok)', color: '#0a0d14' }}>
              <ShieldCheck size={16} />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-[14.5px] text-[var(--ok)] mb-1">2FA is active</p>
              <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed">
                Your account requires a 6-digit code from your authenticator app at sign-in.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="font-semibold text-[14px] mb-2">Disable 2FA</p>
          <p className="text-[12.5px] text-[var(--fg-dim)] mb-4">
            Removing 2FA makes your account less secure. We&apos;ll log you out so your session refreshes.
          </p>
          <button onClick={disable} disabled={pending} className="btn btn-sm"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--bad)', border: '1px solid rgba(239,68,68,0.25)' }}>
            {pending || stage === 'disabling' ? <Loader2 size={12} className="animate-spin" /> : <><X size={12} /> Disable 2FA</>}
          </button>
          {error && <p className="text-[12px] text-[var(--bad)] mt-3">{error}</p>}
        </div>
      </div>
    )
  }

  // ── Showing QR + verify ──
  if (enroll && (stage === 'showing_qr' || stage === 'verifying')) {
    return (
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          {/* QR code */}
          <div className="flex flex-col items-center">
            <div
              className="w-48 h-48 rounded-md overflow-hidden flex items-center justify-center"
              style={{ background: '#fff', padding: 12 }}
              dangerouslySetInnerHTML={{ __html: enroll.qrCode }}
            />
            <p className="text-[11px] text-[var(--fg-mute)] mt-2 text-center">Scan with your app</p>
          </div>

          {/* Instructions + manual entry + code input */}
          <div>
            <ol className="space-y-3 text-[13px] text-[var(--fg-dim)] mb-5">
              <li>
                <strong className="text-[var(--fg)]">1.</strong> Install an authenticator app
                <span className="block text-[11.5px] mt-0.5">
                  Authy, Google Authenticator, 1Password, Aegis — any TOTP app works.
                </span>
              </li>
              <li>
                <strong className="text-[var(--fg)]">2.</strong> Scan the QR code on the left
                <span className="block text-[11.5px] mt-0.5">Or paste this secret manually:</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="font-mono text-[11px] px-2 py-1 rounded flex-1 break-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', color: 'var(--brand)' }}>
                    {enroll.secret}
                  </code>
                  <button onClick={copySecret} className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded shrink-0"
                    style={{ border: '1px solid var(--hairline)', color: 'var(--fg-dim)' }}>
                    {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                  </button>
                </div>
              </li>
              <li>
                <strong className="text-[var(--fg)]">3.</strong> Enter the 6-digit code from your app below
              </li>
            </ol>

            <label className="form-label">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="form-input font-mono text-center text-[20px] tracking-[0.4em] tabular-nums"
              autoFocus
            />

            {error && (
              <div className="mt-3 text-[12px] text-[var(--bad)] flex items-start gap-1.5">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <button onClick={verifyAndEnable} disabled={pending || code.length !== 6 || stage === 'verifying'}
                className="btn btn-primary flex-1">
                {(pending || stage === 'verifying')
                  ? <><Loader2 size={13} className="animate-spin" /> Verifying…</>
                  : <><Check size={13} /> Verify &amp; enable</>}
              </button>
              <button onClick={() => { setStage('idle'); setEnroll(null); setCode(''); setError(null) }}
                disabled={pending} className="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Idle / disabled state — show enable button ──
  return (
    <div className="card p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
          <KeyRound size={15} />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-[14.5px] mb-1">2FA is currently off</p>
          <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed mb-3">
            We strongly recommend enabling 2FA on your account, especially if you have wallet balance, active licenses, or reseller status.
            You&apos;ll need an authenticator app (Authy, Google Authenticator, 1Password, etc.).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Step n={1} title="Install authenticator"  body="Authy, Google Authenticator, 1Password, etc." />
        <Step n={2} title="Scan QR code"           body="We'll show one when you click enable" />
        <Step n={3} title="Verify with 6-digit code" body="From your app — and you're done" />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={startEnroll} disabled={pending || stage === 'enrolling'} className="btn btn-primary">
          {stage === 'enrolling'
            ? <><Loader2 size={13} className="animate-spin" /> Starting…</>
            : <><Lock size={13} /> Enable 2FA</>}
        </button>
        <Link href="/dashboard/account" className="text-[12px] text-[var(--fg-mute)] hover:text-[var(--fg-dim)]">
          Maybe later
        </Link>
      </div>

      {error && <p className="text-[12px] text-[var(--bad)] mt-3 flex items-start gap-1.5"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {error}</p>}
    </div>
  )
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-md p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-2"
        style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
        {n}
      </span>
      <p className="text-[12.5px] font-semibold mb-0.5">{title}</p>
      <p className="text-[11px] text-[var(--fg-mute)] leading-snug">{body}</p>
    </div>
  )
}
