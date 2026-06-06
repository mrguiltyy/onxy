'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, Check, ChevronRight, Cpu, Loader2, MessageSquare, RefreshCw, ShieldOff, Wifi, XCircle, Zap } from 'lucide-react'
import { resetHwidFromTroubleshoot } from './actions'

interface License {
  id:                 string
  product:            string
  key_prefix:         string
  status:             string
  banned:             boolean
  ban_reason:         string | null
  expires_at:         string | null
  hwid:               string | null
  hwid_reset_count:   number
  last_hwid_reset_at: string | null
  max_hwid_resets:    number
  last_seen:          string | null
  login_count:        number
  is_lifetime:        boolean
}

interface LogSummary { event_type: string; code: string | null; created_at: string }

type Issue =
  | 'hwid_mismatch'
  | 'invalid_key'
  | 'expired'
  | 'banned'
  | 'rate_limited'
  | 'wont_connect'
  | 'other'

const issueOptions: { id: Issue; label: string; hint: string; icon: React.ReactNode }[] = [
  { id: 'hwid_mismatch', label: 'HWID mismatch',         hint: 'Tool says hardware doesn\'t match — usually after a hardware change.',  icon: <Cpu size={14} /> },
  { id: 'invalid_key',   label: 'Invalid license',       hint: 'Tool says the key isn\'t recognized.',                                     icon: <ShieldOff size={14} /> },
  { id: 'expired',       label: 'Expired',               hint: 'Tool says the license has expired.',                                       icon: <AlertTriangle size={14} /> },
  { id: 'banned',        label: 'Banned',                hint: 'Tool says you\'re banned.',                                                icon: <XCircle size={14} /> },
  { id: 'rate_limited',  label: 'Rate limited',          hint: 'Tool says too many attempts.',                                             icon: <Zap size={14} /> },
  { id: 'wont_connect',  label: 'Won\'t connect at all', hint: 'Tool closes silently or never reaches our auth server.',                  icon: <Wifi size={14} /> },
  { id: 'other',         label: 'Something else',        hint: 'None of the above match.',                                                icon: <MessageSquare size={14} /> },
]

interface Props {
  licenses:             License[]
  preselectedLicenseId: string | null
  recentLogs:           LogSummary[]
}

interface Verdict {
  status: 'fixed' | 'self_serve' | 'escalate'
  title:  string
  body:   string
  action?: { kind: 'reset_hwid'; licenseId: string } | { kind: 'link'; label: string; href: string }
  ticketPrefill?: string
}

export function TroubleshootWizard({ licenses, preselectedLicenseId, recentLogs }: Props) {
  const router = useRouter()
  const [licenseId, setLicenseId] = useState(preselectedLicenseId ?? licenses[0]?.id ?? '')
  const [issue, setIssue]         = useState<Issue | null>(null)
  const [verdict, setVerdict]     = useState<Verdict | null>(null)
  const [pending, start]          = useTransition()
  const [resetDone, setResetDone] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const license = licenses.find(l => l.id === licenseId) ?? null

  function runDiagnosis(picked: Issue) {
    setIssue(picked)
    if (!license) return
    setVerdict(computeVerdict(picked, license, recentLogs))
  }

  function reset() {
    setIssue(null)
    setVerdict(null)
    setResetDone(false)
    setResetError(null)
  }

  function doHwidReset() {
    setResetError(null)
    const action = verdict?.action
    if (!action || action.kind !== 'reset_hwid') return
    const id = action.licenseId
    start(async () => {
      const res = await resetHwidFromTroubleshoot(id)
      if (!res.ok) { setResetError(res.error ?? 'Failed.'); return }
      setResetDone(true)
    })
  }

  function openTicket() {
    const prefill = encodeURIComponent(verdict?.ticketPrefill ?? '')
    router.push(`/dashboard/tickets/new?license=${license?.id ?? ''}&prefill=${prefill}`)
  }

  // ── Step 1: license picker ──
  return (
    <div className="space-y-5">
      <div className="card p-5">
        <p className="label-mono mb-3">Step 1 · Which license is having the issue?</p>
        <select
          value={licenseId}
          onChange={e => { setLicenseId(e.target.value); reset(); }}
          className="form-input"
        >
          {licenses.map(l => (
            <option key={l.id} value={l.id}>
              {l.product} · {l.key_prefix}-•••  ({l.status}{l.banned ? ', banned' : ''})
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: pick issue */}
      <div className="card p-5">
        <p className="label-mono mb-3">Step 2 · What&apos;s happening?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {issueOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => runDiagnosis(opt.id)}
              className="text-left px-4 py-3 rounded-md border transition-colors group"
              style={{
                background:  issue === opt.id ? 'var(--brand-faint)' : 'var(--surface-2)',
                borderColor: issue === opt.id ? 'rgba(59,130,246,0.30)' : 'var(--hairline)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[var(--brand)]">{opt.icon}</span>
                <span className="text-[13px] font-medium" style={{ color: issue === opt.id ? 'var(--brand)' : 'var(--fg)' }}>{opt.label}</span>
                <ChevronRight size={12} className="ml-auto text-[var(--fg-mute)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11.5px] text-[var(--fg-dim)] leading-relaxed">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: verdict */}
      {verdict && (
        <div className="card overflow-hidden">
          <div
            className="px-5 py-4 border-b border-[var(--hairline)] flex items-center gap-2"
            style={{
              background: verdict.status === 'fixed' || resetDone ? 'rgba(34,197,94,0.06)'
                        : verdict.status === 'self_serve' ? 'var(--brand-faint)'
                        : 'rgba(250,204,21,0.06)',
            }}
          >
            {(verdict.status === 'fixed' || resetDone) && <Check size={14} className="text-[var(--ok)]" />}
            {verdict.status === 'self_serve' && !resetDone && <RefreshCw size={14} className="text-[var(--brand)]" />}
            {verdict.status === 'escalate' && <MessageSquare size={14} className="text-[var(--warn)]" />}
            <h3 className="font-semibold text-[14px]" style={{
              color: verdict.status === 'fixed' || resetDone ? 'var(--ok)'
                   : verdict.status === 'self_serve' ? 'var(--brand)'
                   : 'var(--warn)',
            }}>
              {resetDone ? 'Fixed — HWID cleared' : verdict.title}
            </h3>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-[13.5px] text-[var(--fg-dim)] leading-relaxed whitespace-pre-line">
              {resetDone
                ? 'Reopen your tool and try to log in. Your current hardware will be bound automatically.'
                : verdict.body}
            </p>

            {!resetDone && verdict.action?.kind === 'reset_hwid' && (
              <div className="flex gap-2">
                <button onClick={doHwidReset} disabled={pending} className="btn btn-primary">
                  {pending ? <><Loader2 size={13} className="animate-spin" /> Resetting…</> : <><RefreshCw size={13} /> Reset HWID now</>}
                </button>
              </div>
            )}

            {!resetDone && verdict.action?.kind === 'link' && (
              <Link href={verdict.action.href} className="btn btn-primary inline-flex w-fit">
                {verdict.action.label} <ArrowRight size={13} />
              </Link>
            )}

            {verdict.status === 'escalate' && !resetDone && (
              <button onClick={openTicket} className="btn btn-primary">
                <MessageSquare size={13} /> Open ticket (pre-filled)
              </button>
            )}

            {resetError && (
              <div className="text-[12.5px] text-[var(--bad)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-md px-3 py-2">
                {resetError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Verdict engine — the core auto-fix logic
// ────────────────────────────────────────────────────────────────
function computeVerdict(issue: Issue, lic: License, logs: LogSummary[]): Verdict {
  const recentlyRateLimited = logs.some(l => l.code === 'rate_limited' && Date.now() - new Date(l.created_at).getTime() < 10 * 60 * 1000)
  const resetsLeft = Math.max(0, lic.max_hwid_resets - lic.hwid_reset_count)
  const canReset = !lic.last_hwid_reset_at || (Date.now() - new Date(lic.last_hwid_reset_at).getTime() > 24 * 60 * 60 * 1000)

  // Banned trumps everything
  if (lic.banned || lic.status === 'banned') {
    return {
      status: 'escalate',
      title:  'This license is banned',
      body:   lic.ban_reason ?? 'This key has been banned. If you believe this is a mistake, open a ticket and tell us what happened.',
      ticketPrefill: `My license ${lic.key_prefix}-… was banned. ${lic.ban_reason ? `Stated reason: ${lic.ban_reason}.` : ''} I'm appealing because:\n\n`,
    }
  }

  // Expired
  if (lic.status === 'expired' || (lic.expires_at && new Date(lic.expires_at) < new Date())) {
    return {
      status: 'self_serve',
      title:  'This license has expired',
      body:   'Renew or generate a fresh key — your old data stays on file but the key won\'t authenticate anymore.',
      action: { kind: 'link', label: 'Generate new key', href: '/dashboard/generate' },
    }
  }

  switch (issue) {
    case 'hwid_mismatch': {
      if (!lic.hwid) {
        return {
          status: 'self_serve',
          title:  'No HWID is currently bound',
          body:   'Your license has no hardware lock yet. The first login will set it. If you\'re still seeing a mismatch error, the tool may be sending an empty HWID — make sure you\'re running it as administrator.',
        }
      }
      if (resetsLeft <= 0) {
        return {
          status: 'escalate',
          title:  'No resets remaining',
          body:   `You've used all ${lic.max_hwid_resets} of your self-serve resets. We need to do this one manually — opening a ticket pre-fills the request.`,
          ticketPrefill: `Need an HWID reset for license ${lic.key_prefix}-… — I've used my self-serve resets and changed hardware. Reason for change:\n\n`,
        }
      }
      if (!canReset) {
        const hoursLeft = Math.ceil((86_400_000 - (Date.now() - new Date(lic.last_hwid_reset_at!).getTime())) / 3_600_000)
        return {
          status: 'escalate',
          title:  `Wait ${hoursLeft}h or open a ticket`,
          body:   `You reset within the last 24h. You can wait, or open a ticket if it's urgent.`,
          ticketPrefill: `Need an HWID reset for license ${lic.key_prefix}-… within the cooldown. Reason:\n\n`,
        }
      }
      return {
        status: 'self_serve',
        title:  'We can reset your HWID right now',
        body:   `This will clear the bound hardware and let your current device bind on next login. You'll have ${resetsLeft - 1} resets remaining after this one.`,
        action: { kind: 'reset_hwid', licenseId: lic.id },
      }
    }

    case 'invalid_key': {
      if (lic.status === 'pending') {
        return {
          status: 'self_serve',
          title:  'Your key hasn\'t been used yet — that\'s normal',
          body:   `This key is pending — the first successful login will activate it. Double-check you typed it exactly (case-sensitive, no extra spaces). Full key starts with ${lic.key_prefix}.`,
        }
      }
      return {
        status: 'escalate',
        title:  'Server says the key exists and is active',
        body:   `Looks fine on our end. Most likely:\n• The tool is sending the wrong key (typo)\n• The tool is pointed at the wrong app_id\n• Something else weird\n\nOpening a ticket helps us see what the tool sent.`,
        ticketPrefill: `Tool says license ${lic.key_prefix}-… is invalid but the dashboard shows it as active. I typed it as:\n\n[paste exactly what you entered]\n\nApp I'm using: \n`,
      }
    }

    case 'expired':
      // Handled above (lic.status check). If we got here, the API said expired but DB says not.
      return {
        status: 'self_serve',
        title:  'Dashboard shows your license is still active',
        body:   'If your tool still says expired, force-close and reopen it. Server time wins — if it&apos;s still active here, you&apos;re fine.',
      }

    case 'rate_limited':
      return {
        status: 'self_serve',
        title:  recentlyRateLimited ? 'Yes, you triggered rate limiting' : 'Likely typo loop',
        body:   `Too many failed attempts from your IP in a short window blocks login for 5 minutes. ${recentlyRateLimited ? 'We see rate-limit events on your account in the last 10 minutes. ' : ''}Wait 5 minutes, then try once with the exact key from your dashboard (copy-paste it). Avoid retrying the wrong key — every fail extends the block.`,
      }

    case 'wont_connect':
      return {
        status: 'self_serve',
        title:  'This is almost always a network issue',
        body:   `Check, in this order:\n1. Can you load https://onxy.cc in a browser? If no → your network is blocking us.\n2. Are you on Windows Defender / a corporate firewall? Whitelist the tool .exe.\n3. Is the tool the latest version? Old versions may target a different API URL.\n\nIf all 3 are fine and it still fails silently, open a ticket and tell us what error (if any) the tool logs.`,
        ticketPrefill: `Tool won't connect for license ${lic.key_prefix}-…. I can reach onxy.cc in my browser. Tool version: [x.y.z]. Error logs from the tool:\n\n`,
      }

    case 'banned':
      return {
        status: 'escalate',
        title:  'Dashboard shows your license is not banned',
        body:   `Our records show this license is fine. If your tool says banned, the tool itself might be displaying a wrong message — open a ticket so we can check.`,
        ticketPrefill: `Tool says license ${lic.key_prefix}-… is banned but dashboard shows it as active. Tool version: \n`,
      }

    default:
      return {
        status: 'escalate',
        title:  'Tell us what\'s happening',
        body:   'We couldn\'t auto-diagnose this. Opening a ticket pre-fills your license info — describe the issue and we\'ll help.',
        ticketPrefill: `Issue with license ${lic.key_prefix}-…:\n\n`,
      }
  }
}
