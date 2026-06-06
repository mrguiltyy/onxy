import { cn } from '@/lib/utils'

type Tone = 'ok' | 'warn' | 'pend' | 'bad' | 'brand'

export function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn(`pill pill-${tone}`, className)}>{children}</span>
}
