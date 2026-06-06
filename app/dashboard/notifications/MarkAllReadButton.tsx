'use client'
import { useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { markAllRead } from './actions'

export function MarkAllReadButton() {
  const [pending, start] = useTransition()
  return (
    <button onClick={() => start(async () => { await markAllRead() })} disabled={pending} className="btn btn-secondary btn-sm">
      {pending ? <Loader2 size={12} className="animate-spin" /> : <><Check size={12} /> Mark all read</>}
    </button>
  )
}
