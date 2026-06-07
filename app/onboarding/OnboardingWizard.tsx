'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Eye, Image as ImageIcon, KeyRound, Lock, Rocket, Settings as SettingsIcon, Shield, ShieldCheck, Sparkles, User, Loader2, BarChart3, Zap, ExternalLink } from 'lucide-react'
import { AVATAR_PRESETS, BANNER_PRESETS } from './presets'
import { saveOnboarding, completeOnboarding } from './actions'

interface Initial {
  avatar_url:         string | null
  banner_url:         string | null
  bio:                string | null
  profile_public:     boolean
  two_factor_enabled: boolean
  tier:               string
}

interface Props {
  userId:    string
  username:  string
  email:     string
  createdAt: string
  initial:   Initial
}

const STEPS = [
  { n: 1, label: 'Welcome',    icon: Sparkles    },
  { n: 2, label: 'Profile',    icon: User        },
  { n: 3, label: 'Visibility', icon: Eye         },
  { n: 4, label: 'Security',   icon: Shield      },
  { n: 5, label: 'Features',   icon: ShieldCheck },
  { n: 6, label: 'Quick',      icon: Zap         },
  { n: 7, label: 'Project',    icon: Rocket      },
  { n: 8, label: 'Done',       icon: Check       },
]

export function OnboardingWizard({ userId, username, email, createdAt, initial }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // state for fields
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? '')
  const [bannerUrl, setBannerUrl] = useState(initial.banner_url ?? '')
  const [bio,       setBio]       = useState(initial.bio ?? '')
  const [profilePublic, setProfilePublic] = useState(initial.profile_public)

  function next() {
    setError(null)
    if (step >= 8) {
      finish()
      return
    }
    // Auto-save on step transitions
    start(async () => {
      const res = await saveOnboarding({ avatarUrl, bannerUrl, bio, profilePublic })
      if (!res.ok) setError(res.error ?? 'Save failed.')
      setStep(s => s + 1)
    })
  }

  function back() {
    setError(null)
    setStep(s => Math.max(1, s - 1))
  }

  function finish() {
    start(async () => {
      const res = await completeOnboarding()
      if (!res.ok) { setError(res.error ?? 'Could not complete.'); return }
      router.push('/dashboard?welcome=1')
      router.refresh()
    })
  }

  // Memberized date
  const memberSince = new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="w-full max-w-[1100px]">
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
      >
        {/* Step indicator */}
        <div className="px-8 pt-7 pb-2">
          <ol className="flex items-center justify-between gap-1.5 flex-wrap">
            {STEPS.map((s, i) => {
              const done   = step > s.n
              const active = step === s.n
              return (
                <li key={s.n} className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0 transition-colors"
                    style={{
                      background: done   ? 'var(--ok)'
                               : active ? 'var(--brand)'
                               : 'var(--surface-2)',
                      color:      done || active ? '#0a0d14' : 'var(--fg-mute)',
                      border:     active ? '1px solid var(--brand)' : '1px solid var(--hairline)',
                      boxShadow:  active ? '0 0 0 3px rgba(59,130,246,0.20)' : undefined,
                    }}
                  >
                    {done ? <Check size={10} /> : s.n}
                  </span>
                  <span className={`text-[12px] font-medium ${active ? 'text-[var(--fg)]' : 'text-[var(--fg-mute)]'}`}>{s.label}</span>
                  {i < STEPS.length - 1 && <span className="hidden sm:block w-4 h-px" style={{ background: done ? 'var(--ok)' : 'var(--hairline)' }} />}
                </li>
              )
            })}
          </ol>

          {/* Progress bar */}
          <div className="mt-4 h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
            <div className="h-full transition-all duration-300" style={{
              width: `${(step / 8) * 100}%`,
              background: 'linear-gradient(90deg, var(--ok), var(--brand))',
            }} />
          </div>
        </div>

        {/* Step body */}
        <div className="px-8 py-8 min-h-[460px]">
          {step === 1 && <StepWelcome username={username} />}
          {step === 2 && <StepProfile  avatarUrl={avatarUrl} bannerUrl={bannerUrl} setAvatarUrl={setAvatarUrl} setBannerUrl={setBannerUrl} />}
          {step === 3 && <StepVisibility username={username} memberSince={memberSince} profilePublic={profilePublic} setProfilePublic={setProfilePublic} bio={bio} setBio={setBio} avatarUrl={avatarUrl} />}
          {step === 4 && <StepSecurity twoFactorEnabled={initial.two_factor_enabled} />}
          {step === 5 && <StepFeatures />}
          {step === 6 && <StepQuick />}
          {step === 7 && <StepProject />}
          {step === 8 && <StepDone username={username} />}
        </div>

        {/* Footer nav */}
        <div className="px-8 py-5 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--hairline)' }}>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={back} disabled={pending} className="btn btn-secondary">
                <ChevronLeft size={13} /> Back
              </button>
            )}
            <button onClick={finish} disabled={pending} className="text-[12px] text-[var(--fg-mute)] hover:text-[var(--fg-dim)] underline-offset-2 hover:underline">
              Skip &amp; finish setup
            </button>
          </div>

          {error && <p className="text-[12px] text-[var(--bad)] text-center flex-1 max-w-[280px] truncate">{error}</p>}

          {step < 8 ? (
            <button onClick={next} disabled={pending} className="btn btn-primary">
              {pending ? <Loader2 size={13} className="animate-spin" /> : <>Next <ChevronRight size={13} /></>}
            </button>
          ) : (
            <button onClick={finish} disabled={pending} className="btn btn-primary">
              {pending ? <Loader2 size={13} className="animate-spin" /> : <>Open dashboard <ChevronRight size={13} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   STEP 1 — Welcome
   ────────────────────────────────────────────────────────────── */
function StepWelcome({ username }: { username: string }) {
  return (
    <div className="text-center max-w-[600px] mx-auto py-6">
      <div className="w-16 h-16 mx-auto rounded-2xl mb-5 flex items-center justify-center" style={{
        background: 'var(--brand-gradient)', boxShadow: '0 12px 32px rgba(240,164,183,0.30)',
      }}>
        <Sparkles size={28} className="text-white" />
      </div>
      <p className="label-mono mb-3">Welcome aboard</p>
      <h1 className="text-[32px] font-bold tracking-tight mb-3" style={{ letterSpacing: '-0.025em' }}>
        Hi <span style={{
          background: 'var(--brand-gradient)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>{username}</span> 👋
      </h1>
      <p className="text-[14.5px] text-[var(--fg-dim)] leading-relaxed mb-3">
        A few quick steps to set up your account. Everything is optional and editable later from your account page.
      </p>
      <p className="text-[12px] text-[var(--fg-mute)] mb-6">
        In a rush? Click <strong className="text-[var(--fg-dim)]">&ldquo;Skip &amp; finish setup&rdquo;</strong> at the bottom of any step to jump straight to your dashboard.
      </p>
      <ul className="text-left text-[13px] space-y-2 max-w-[420px] mx-auto">
        <PerkRow icon={<User size={12} />}        label="Pick a profile photo + banner" />
        <PerkRow icon={<Eye size={12} />}         label="Decide if your profile is public" />
        <PerkRow icon={<Shield size={12} />}      label="Optionally enable 2FA" />
        <PerkRow icon={<Rocket size={12} />}      label="Spin up your first project" />
      </ul>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   STEP 2 — Profile photo + banner
   ────────────────────────────────────────────────────────────── */
function StepProfile({ avatarUrl, bannerUrl, setAvatarUrl, setBannerUrl }: {
  avatarUrl: string; bannerUrl: string; setAvatarUrl: (v: string) => void; setBannerUrl: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-6">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <User size={18} className="text-[var(--brand)]" />
        </span>
        <div>
          <h2 className="text-[20px] font-bold tracking-tight">Profile photo &amp; banner</h2>
          <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">Set a profile picture and banner. Enter a URL or pick from our selection below.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Avatar */}
        <div>
          <label className="form-label">Profile photo URL</label>
          <input
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="form-input"
          />
          <p className="label-mono mt-4 mb-2">Or pick one</p>
          <div className="grid grid-cols-6 gap-2 max-h-[340px] overflow-y-auto pr-1">
            {AVATAR_PRESETS.map(p => (
              <button
                key={p.url}
                type="button"
                onClick={() => setAvatarUrl(p.url)}
                className="aspect-square rounded-md overflow-hidden border-2 transition-all hover:scale-105"
                style={{
                  borderColor: avatarUrl === p.url ? 'var(--brand)' : 'transparent',
                  boxShadow:   avatarUrl === p.url ? '0 0 0 2px rgba(59,130,246,0.30)' : 'none',
                  background:  'var(--surface-2)',
                }}
              >
                <img src={p.url} alt={p.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Banner */}
        <div>
          <label className="form-label">Banner URL</label>
          <input
            value={bannerUrl}
            onChange={e => setBannerUrl(e.target.value)}
            placeholder="https://example.com/banner.png"
            className="form-input"
          />
          <p className="label-mono mt-4 mb-2">Or pick one</p>
          <div className="grid grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1">
            {BANNER_PRESETS.map(p => (
              <button
                key={p.url}
                type="button"
                onClick={() => setBannerUrl(p.url)}
                className="aspect-[16/6] rounded-md overflow-hidden border-2 transition-all hover:scale-105"
                style={{
                  borderColor: bannerUrl === p.url ? 'var(--brand)' : 'transparent',
                  boxShadow:   bannerUrl === p.url ? '0 0 0 2px rgba(59,130,246,0.30)' : 'none',
                  background:  'var(--surface-2)',
                }}
              >
                <img src={p.url} alt={p.alt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   STEP 3 — Visibility + live preview
   ────────────────────────────────────────────────────────────── */
function StepVisibility({ username, memberSince, profilePublic, setProfilePublic, bio, setBio, avatarUrl }: {
  username: string; memberSince: string; profilePublic: boolean; setProfilePublic: (v: boolean) => void; bio: string; setBio: (v: string) => void; avatarUrl: string;
}) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-6">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(20,184,166,0.15)' }}>
          <Eye size={18} style={{ color: '#14b8a6' }} />
        </span>
        <div>
          <h2 className="text-[20px] font-bold tracking-tight">Your public profile</h2>
          <p className="text-[13px] text-[var(--fg-dim)] mt-0.5 max-w-[600px] leading-relaxed">
            Control what others see on your profile page. Add a short bio and choose whether your profile is visible in the directory. You can change this anytime in <strong className="text-[var(--fg)]">Account → Profile</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profilePublic}
              onChange={e => setProfilePublic(e.target.checked)}
              className="accent-[var(--brand)] mt-1 w-4 h-4"
            />
            <div>
              <p className="font-semibold text-[14px]">Profile visible to others</p>
              <p className="text-[12px] text-[var(--fg-mute)] leading-relaxed">
                When on, your profile appears in the directory and at the link below.
              </p>
            </div>
          </label>

          <div className="mt-5">
            <label className="form-label">Short bio <span className="text-[var(--fg-mute)] normal-case text-[11px]">(optional)</span></label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 500))}
              rows={5}
              placeholder="A few words about you or your work…"
              className="form-input resize-none font-[inherit]"
            />
            <p className="text-[10.5px] text-[var(--fg-mute)] mt-1 text-right tabular-nums">{bio.length}/500</p>
          </div>

          <Link href={`/u/${username}`} target="_blank" className="text-[12.5px] text-[var(--brand)] hover:underline inline-flex items-center gap-1 mt-3">
            View your profile <ExternalLink size={10} />
          </Link>
        </div>

        {/* Live preview */}
        <div>
          <p className="label-mono mb-2">Live preview</p>
          <div className="rounded-lg overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
            border: '1px solid var(--hairline)',
          }}>
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div
                  className="w-16 h-16 rounded-full border-2 shrink-0 flex items-center justify-center text-[26px] font-bold"
                  style={{
                    background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'var(--brand-gradient)',
                    color: '#3a2630',
                    borderColor: 'rgba(255,255,255,0.15)',
                  }}
                >
                  {!avatarUrl && username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-mute)]">Member</p>
                  <p className="text-[16px] font-bold text-[var(--fg)]">@{username}</p>
                  <p className="text-[11px] text-[var(--fg-dim)] mt-0.5">usr_xxxx · Member since {memberSince}</p>
                  <div className="flex items-center gap-3 mt-3 text-[11px]">
                    <span><strong className="text-[var(--fg)]">0</strong> <span className="text-[var(--fg-mute)]">Total Keys</span></span>
                    <span><strong className="text-[var(--fg)]">0</strong> <span className="text-[var(--fg-mute)]">Referrals</span></span>
                    <span><strong className="text-[var(--fg)]">0</strong> <span className="text-[var(--fg-mute)]">Projects</span></span>
                  </div>
                </div>
              </div>
              {bio && <p className="text-[12.5px] text-[var(--fg-dim)] mt-3 leading-relaxed border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>{bio}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   STEP 4 — Security
   ────────────────────────────────────────────────────────────── */
function StepSecurity({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-6">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
          <Shield size={18} style={{ color: '#a855f7' }} />
        </span>
        <div>
          <h2 className="text-[20px] font-bold tracking-tight">Security &amp; privacy</h2>
          <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">A few important things about your account and data.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg p-5" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
          <p className="font-semibold text-[14.5px] mb-1">You&apos;re on the free tier</p>
          <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed">
            You can explore the dashboard, create a project, and try license management. <Link href="/reseller" className="text-[var(--brand)] hover:underline">Upgrade anytime</Link> to unlock full seller features and higher limits.
          </p>
        </div>

        <div className="rounded-lg p-5 flex items-start gap-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Lock size={16} className="text-[var(--brand)]" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-[14px] mb-1 flex items-center gap-2">
              Two-factor authentication
              {twoFactorEnabled && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.10)', color: 'var(--ok)' }}>ON</span>}
            </p>
            <p className="text-[12.5px] text-[var(--fg-dim)] mb-3 leading-relaxed">
              Add an extra layer of security. Set it up now—scan the QR code in a popup—or skip and do it later in <strong className="text-[var(--fg)]">Account → Security</strong>.
            </p>
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" disabled>
                <Lock size={11} /> Set up 2FA <span className="text-[10px] opacity-60">(coming soon)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-5 flex items-start gap-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(20,184,166,0.15)' }}>
            <ShieldCheck size={16} style={{ color: '#14b8a6' }} />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-[14px] mb-1">Data &amp; privacy</p>
            <p className="text-[12.5px] text-[var(--fg-dim)] leading-relaxed">
              We only store what&apos;s needed for license validation and your account. You can export or delete your data anytime from your account settings after you finish onboarding.
            </p>
            <p className="text-[11.5px] text-[var(--fg-mute)] mt-2">
              Privacy &amp; data settings are available in <Link href="/dashboard/account" className="text-[var(--brand)] hover:underline">Account</Link> once you&apos;re set up.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   STEP 5 — Features
   ────────────────────────────────────────────────────────────── */
function StepFeatures() {
  return (
    <div>
      <div className="flex items-start gap-3 mb-6">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(20,184,166,0.15)' }}>
          <ShieldCheck size={18} style={{ color: '#14b8a6' }} />
        </span>
        <div>
          <h2 className="text-[20px] font-bold tracking-tight">Secure license management</h2>
          <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">Protect your software with license keys, HWID locking, and real-time monitoring.</p>
        </div>
      </div>

      <div className="space-y-2 ml-13">
        <Feature label="Generate and manage license keys" />
        <Feature label="Track user activity and analytics" />
        <Feature label="Configure security and HWID locks" />
        <Feature label="Multi-language SDK (C#, C++, Python, Node.js, Java, VB.NET)" />
        <Feature label="Brute-force protection per-IP and per-app" />
        <Feature label="Lifetime updates included on every plan" />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   STEP 6 — Quick start
   ────────────────────────────────────────────────────────────── */
function StepQuick() {
  return (
    <div>
      <div className="flex items-start gap-3 mb-6">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Rocket size={18} style={{ color: '#f59e0b' }} />
        </span>
        <div>
          <h2 className="text-[20px] font-bold tracking-tight">Quick start</h2>
          <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">After creating your project you can:</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <QuickCard icon={<KeyRound size={18} />}     accent="#f0a4b7" title="Create keys"   body="Generate licenses for your app" />
        <QuickCard icon={<BarChart3 size={18} />}     accent="#a2c8ee" title="View analytics" body="Monitor usage and activity" />
        <QuickCard icon={<SettingsIcon size={18} />}  accent="#c5b3df" title="Configure"    body="Security, HWID, and more" />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   STEP 7 — Project
   ────────────────────────────────────────────────────────────── */
function StepProject() {
  return (
    <div>
      <div className="flex items-start gap-3 mb-6">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
          <Rocket size={18} style={{ color: '#6366f1' }} />
        </span>
        <div>
          <h2 className="text-[20px] font-bold tracking-tight">Your first project</h2>
          <p className="text-[13px] text-[var(--fg-dim)] mt-0.5 max-w-[600px]">
            Projects are applications you embed our auth into. Each project gets an <code className="font-mono text-[var(--brand)]">app_id</code> and <code className="font-mono text-[var(--brand)]">app_secret</code>. You can create one now or skip and do it later.
          </p>
        </div>
      </div>

      <div className="rounded-lg p-6 text-center" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(168,85,247,0.05))',
        border: '1px solid var(--hairline)',
      }}>
        <ImageIcon size={28} className="mx-auto mb-3 text-[var(--brand)] opacity-50" />
        <p className="font-semibold text-[14.5px] mb-2">Set this up after onboarding</p>
        <p className="text-[12.5px] text-[var(--fg-dim)] max-w-[440px] mx-auto leading-relaxed mb-4">
          You&apos;ll need to upgrade to a reseller plan (or be on the free tier) to create projects. Once you&apos;re ready, head to <strong className="text-[var(--fg)]">Applications</strong> from the dashboard.
        </p>
        <Link href="/reseller" className="btn btn-secondary btn-sm">
          See reseller plans
        </Link>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   STEP 8 — Done
   ────────────────────────────────────────────────────────────── */
function StepDone({ username }: { username: string }) {
  return (
    <div className="text-center py-10 max-w-[480px] mx-auto">
      <div
        className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center relative"
        style={{
          background: 'var(--brand-gradient)',
          boxShadow: '0 16px 48px rgba(240,164,183,0.40)',
        }}
      >
        <Check size={36} className="text-white" />
      </div>
      <h2 className="text-[28px] font-bold tracking-tight mb-3" style={{ letterSpacing: '-0.025em' }}>
        You&apos;re all set, {username}
      </h2>
      <p className="text-[14px] text-[var(--fg-dim)] mb-6 leading-relaxed">
        Your account is ready. You can adjust any of these settings anytime from <strong className="text-[var(--fg)]">Account</strong>. Hit the button below to open your dashboard.
      </p>

      <div className="grid grid-cols-3 gap-2 text-[11.5px] text-[var(--fg-dim)] mb-2 max-w-[360px] mx-auto">
        <div className="rounded-md p-2.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
          <p className="font-semibold text-[var(--fg)]">Browse</p>
          <p>Products &amp; resells</p>
        </div>
        <div className="rounded-md p-2.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
          <p className="font-semibold text-[var(--fg)]">Link</p>
          <p>Discord +$1</p>
        </div>
        <div className="rounded-md p-2.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
          <p className="font-semibold text-[var(--fg)]">Build</p>
          <p>Auth SDK in 10 lines</p>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Small bits
   ────────────────────────────────────────────────────────────── */
function Feature({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-[13.5px] text-[var(--fg-dim)]">
      <Check size={14} style={{ color: 'var(--ok)' }} /> {label}
    </p>
  )
}

function PerkRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-2 text-[var(--fg-dim)]">
      <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>{icon}</span>
      {label}
    </li>
  )
}

function QuickCard({ icon, title, body, accent }: { icon: React.ReactNode; title: string; body: string; accent: string }) {
  return (
    <div className="rounded-lg p-5" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
      <span className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{
        background: `${accent}26`, color: accent,
      }}>{icon}</span>
      <p className="font-semibold text-[14px] mb-0.5">{title}</p>
      <p className="text-[12px] text-[var(--fg-dim)]">{body}</p>
    </div>
  )
}
