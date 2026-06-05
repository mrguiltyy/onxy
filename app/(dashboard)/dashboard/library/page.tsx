'use client'
import { useState } from 'react'
import { Download, RefreshCw, Cpu, AlertCircle, Package, Pause, Play } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { SecretField } from '@/components/ui/SecretField'

interface LicenseItem {
  id:          number
  name:        string
  version:     string
  plan:        string
  key:         string
  purchasedAt: string
  expiresAt:   string | null
  daysLeft:    number | null
  hwid:        string
  size:        string
  paused:      boolean
  pauseUsed:   boolean
  pausesAllowed: boolean
}

const initialLibrary: LicenseItem[] = [
  { id: 1, name: 'Onyx Rage',    version: 'v2.1.0', plan: '1 Month',  key: 'ONYX-R4G3-XK2M-9P7Q-LWTZ', purchasedAt: 'May 3, 2026',  expiresAt: 'Jun 3, 2026',  daysLeft: 28,    hwid: '1/2', size: '4.2 MB', paused: false, pauseUsed: false, pausesAllowed: true  },
  { id: 2, name: 'Onyx Stealth', version: 'v1.4.2', plan: '1 Month',  key: 'ONYX-ST3L-KM9V-NB4X-QRTY', purchasedAt: 'May 19, 2026', expiresAt: 'Jun 19, 2026', daysLeft: 14,    hwid: '1/1', size: '3.8 MB', paused: false, pauseUsed: true,  pausesAllowed: true  },
  { id: 3, name: 'Onyx Core',    version: 'v3.0.1', plan: 'Lifetime', key: 'ONYX-C0R3-YT7W-PX5J-VMNS', purchasedAt: 'Apr 12, 2026', expiresAt: null,           daysLeft: null,  hwid: '0/2', size: '6.1 MB', paused: false, pauseUsed: false, pausesAllowed: false },
]

export default function LibraryPage() {
  const { toast } = useToast()
  const [library, setLibrary]     = useState<LicenseItem[]>(initialLibrary)
  const [resetting, setResetting] = useState<number | null>(null)
  const [pausing, setPausing]     = useState<number | null>(null)

  const downloadTool = (name: string) => {
    toast({ title: 'Download starting', description: `Generating signed link for ${name}...`, variant: 'info' })
  }

  const confirmReset = () => {
    toast({ title: 'HWID reset request submitted', description: 'An admin will review and approve.', variant: 'success' })
    setResetting(null)
  }

  const togglePause = (id: number) => {
    setLibrary(library.map(l => {
      if (l.id !== id) return l
      if (l.paused) {
        // Resume
        toast({ title: 'Plan resumed', description: 'Your license is active again.', variant: 'success' })
        return { ...l, paused: false }
      }
      // Pause
      if (l.pauseUsed) return l
      toast({ title: 'Plan paused', description: `Your remaining ${l.daysLeft} days are preserved.`, variant: 'success' })
      return { ...l, paused: true, pauseUsed: true }
    }))
    setPausing(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl tracking-tight">My Library</h1>
        <p className="text-[#a3a39e] text-sm mt-1">All your purchases. Re-download anytime.</p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-[rgba(255,174,80,0.2)] bg-[rgba(255,174,80,0.05)] mb-8">
        <AlertCircle size={16} className="text-[var(--warn)] mt-0.5 shrink-0" />
        <div>
          <p className="text-[var(--warn)] font-semibold text-sm">Security reminder</p>
          <p className="text-[#a3a39e] text-xs mt-0.5 leading-relaxed">
            Your license keys are masked by default. Click the eye to reveal. Every download link is watermarked with your account ID — <strong className="text-white">do not share or leak</strong>.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {library.map(item => {
          const isExpiring = item.daysLeft !== null && item.daysLeft < 14
          return (
            <Card key={item.id} className="p-6">
              {/* Top */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-md flex items-center justify-center" style={{ background: 'var(--c-faint)', border: '1px solid var(--c-dim)' }}>
                    <Package size={18} className="text-[var(--c)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-white font-bold text-base">{item.name}</h2>
                      <span className="code-inline text-[11px]">{item.version}</span>
                      {item.paused && <StatusBadge tone="warn" dot>Paused</StatusBadge>}
                      {!item.paused && isExpiring && <StatusBadge tone="warn">Expiring soon</StatusBadge>}
                    </div>
                    <p className="text-xs text-[#a3a39e]">
                      {item.plan} · Purchased {item.purchasedAt}
                      {item.expiresAt
                        ? <> · Expires <span className={isExpiring ? 'text-[var(--warn)]' : 'text-white'}>{item.expiresAt}</span></>
                        : <> · <span className="text-[var(--c)]">Lifetime</span></>}
                    </p>
                  </div>
                </div>
                {item.paused
                  ? <StatusBadge tone="warn" dot>Paused</StatusBadge>
                  : <StatusBadge tone="ok" dot>Active</StatusBadge>
                }
              </div>

              {/* License key (masked + reveal) */}
              <div className="mb-4">
                <SecretField label="License key" value={item.key} />
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
                {[
                  { label: 'HWID slots',   value: item.hwid       },
                  { label: 'File size',    value: item.size       },
                  { label: 'Last update',  value: '2 hours ago'   },
                ].map(m => (
                  <div key={m.label} className="bg-[#0a0a0a] border border-[var(--hairline)] rounded-md p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-mute)] mb-0.5">{m.label}</p>
                    <p className="text-white text-sm font-semibold">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--hairline)]">
                <Button variant="primary" icon={<Download size={14} />} onClick={() => downloadTool(item.name)} disabled={item.paused}>
                  Download
                </Button>
                <Button variant="outline" icon={<RefreshCw size={14} />} onClick={() => setResetting(item.id)}>
                  Reset HWID
                </Button>

                {/* Pause control — only show if plan supports it */}
                {item.pausesAllowed && (
                  item.paused ? (
                    <Button variant="outline" icon={<Play size={14} />} onClick={() => togglePause(item.id)}>
                      Resume plan
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      icon={<Pause size={14} />}
                      onClick={() => setPausing(item.id)}
                      disabled={item.pauseUsed}
                      title={item.pauseUsed ? 'Pause already used on this plan' : 'Pause plan (1 use per plan)'}
                    >
                      {item.pauseUsed ? 'Pause used' : 'Pause plan'}
                    </Button>
                  )
                )}

                {!item.paused && isExpiring && (
                  <Button variant="secondary">Renew license</Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <Modal
        open={resetting !== null}
        onClose={() => setResetting(null)}
        title="Reset HWID?"
        description="This will unbind your hardware ID and free up your slot. You'll need to re-register on next tool launch."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetting(null)}>Cancel</Button>
            <Button variant="primary" onClick={confirmReset}>Confirm reset</Button>
          </>
        }
      >
        <div className="p-4 rounded-md bg-[rgba(255,174,80,0.06)] border border-[rgba(255,174,80,0.15)] text-[13px] text-[#a3a39e]">
          You can reset your HWID up to 2 times per month per license at no cost. Additional resets require admin approval.
        </div>
      </Modal>

      <Modal
        open={pausing !== null}
        onClose={() => setPausing(null)}
        title="Pause your plan?"
        description="You can pause each license exactly once per plan duration. Your remaining days are preserved while paused."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPausing(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => pausing !== null && togglePause(pausing)}>Pause now</Button>
          </>
        }
      >
        <div className="p-4 rounded-md bg-[rgba(255,174,80,0.06)] border border-[rgba(255,174,80,0.15)] text-[13px] text-[#a3a39e]">
          While paused, the tool will not authenticate. Resume any time to continue using the remaining days.
          You cannot pause again on this plan after resuming — this is a one-time use.
        </div>
      </Modal>
    </div>
  )
}
