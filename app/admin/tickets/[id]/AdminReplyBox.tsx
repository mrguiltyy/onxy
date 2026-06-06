'use client'
import { useState, useTransition } from 'react'
import { Send, Lock, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { replyToTicket, closeTicket, reopenTicket } from './actions'

interface Props {
  ticketId:      string
  customerEmail: string
  customerName:  string
  subject:       string
  status:        string
}

export function AdminReplyBox({ ticketId, status }: Props) {
  const [internal, setInternal] = useState(false)
  const [body, setBody]         = useState('')
  const [pending, start]        = useTransition()

  const send = (fd: FormData) => {
    fd.set('ticketId', ticketId)
    fd.set('body', body)
    fd.set('internal', internal ? 'on' : '')
    start(async () => {
      await replyToTicket(fd)
      setBody('')
    })
  }

  const close = () => {
    const fd = new FormData()
    fd.set('ticketId', ticketId)
    start(async () => { await closeTicket(fd) })
  }

  const reopen = () => {
    const fd = new FormData()
    fd.set('ticketId', ticketId)
    start(async () => { await reopenTicket(fd) })
  }

  if (status === 'closed') {
    return (
      <div className="card p-5 text-center">
        <p className="text-[13.5px] text-[var(--fg-dim)] mb-3">This ticket is closed.</p>
        <Button variant="outline" onClick={reopen} loading={pending} icon={<RotateCcw size={13} />}>
          Reopen ticket
        </Button>
      </div>
    )
  }

  return (
    <form action={send} className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold">Reply</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={internal}
            onChange={e => setInternal(e.target.checked)}
            className="accent-[var(--warn)]"
          />
          <span className="text-[12px] text-[var(--fg-dim)] inline-flex items-center gap-1">
            <Lock size={11} /> Internal note (hidden from customer)
          </span>
        </label>
      </div>

      <textarea
        className="input"
        rows={6}
        placeholder={internal ? 'Internal note — visible only to staff...' : 'Reply to the customer...'}
        value={body}
        onChange={e => setBody(e.target.value)}
        required
      />

      <div className="flex items-center justify-between mt-3 gap-2">
        <Button type="button" variant="danger" onClick={close} loading={pending} icon={<X size={13} />}>
          Close ticket
        </Button>
        <Button type="submit" variant="primary" loading={pending} icon={pending ? undefined : <Send size={13} />} disabled={!body.trim()}>
          {pending ? 'Sending...' : internal ? 'Save note' : 'Send reply'}
        </Button>
      </div>

      {!internal && (
        <p className="text-[11px] text-[var(--fg-mute)] mt-2">
          Customer will get an email with your reply preview.
        </p>
      )}
    </form>
  )
}
