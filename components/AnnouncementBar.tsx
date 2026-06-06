import Link from 'next/link'
import { Megaphone, ArrowRight } from 'lucide-react'

interface AnnouncementBarProps {
  message:    string
  variant:    'info' | 'warn' | 'success' | 'brand'
  linkUrl?:   string | null
  linkLabel?: string | null
}

const variantStyle: Record<AnnouncementBarProps['variant'], { bg: string; border: string; fg: string }> = {
  info:    { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  fg: 'var(--brand)' },
  warn:    { bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.25)',  fg: 'var(--warn)' },
  success: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   fg: 'var(--ok)' },
  brand:   { bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.30)',  fg: 'var(--brand)' },
}

export function AnnouncementBar({ message, variant, linkUrl, linkLabel }: AnnouncementBarProps) {
  const s = variantStyle[variant]

  return (
    <div
      className="border-b"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <div className="container-x flex items-center justify-center gap-3 py-2.5 flex-wrap">
        <Megaphone size={13} style={{ color: s.fg }} className="shrink-0" />
        <p className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
          {message}
        </p>
        {linkUrl && (
          <Link
            href={linkUrl}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold hover:underline"
            style={{ color: s.fg }}
          >
            {linkLabel ?? 'Learn more'}
            <ArrowRight size={11} />
          </Link>
        )}
      </div>
    </div>
  )
}
