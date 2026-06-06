'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabaseBrowser } from '@/lib/supabase/client'

const CATEGORIES = [
  { value: 'general',    label: 'General question'  },
  { value: 'billing',    label: 'Billing'           },
  { value: 'technical',  label: 'Technical issue'   },
  { value: 'hwid_reset', label: 'HWID reset'        },
]

const PRIORITIES = [
  { value: 'low',    label: 'Low — when you have time' },
  { value: 'medium', label: 'Medium — within a day'    },
  { value: 'high',   label: 'High — blocking my work'  },
]

export default function NewTicketPage() {
  const router = useRouter()
  const [subject,  setSubject]  = useState('')
  const [body,     setBody]     = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState('medium')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setLoading(true); setError(null)

    try {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not signed in.'); setLoading(false); return }

      interface NewTicket { id: string }
      const { data: ticketRaw, error: tErr } = await supabase
        .from('tickets')
        .insert({
          user_id:       user.id,
          subject:       subject.trim(),
          category,
          priority,
          status:        'open',
        } as never)
        .select('id')
        .single<NewTicket>()

      if (tErr || !ticketRaw) { setError(tErr?.message ?? 'Failed to open ticket.'); setLoading(false); return }

      await supabase.from('ticket_messages').insert({
        ticket_id:   ticketRaw.id,
        author_id:   user.id,
        is_admin:    false,
        is_internal: false,
        body:        body.trim(),
      } as never)

      router.push(`/dashboard/tickets/${ticketRaw.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
      setLoading(false)
    }
  }

  return (
    <div className="animate-in max-w-[640px]">
      <Link href="/dashboard/tickets" className="inline-flex items-center gap-1.5 text-[var(--fg-dim)] hover:text-[var(--fg)] text-sm mb-4 transition-colors">
        <ArrowLeft size={14} /> Back to tickets
      </Link>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight">Open a ticket</h1>
        <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">
          We respond fastest to tickets with specific subjects and clear detail.
        </p>
      </div>

      <div className="card p-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-md mb-5" style={{ background: 'var(--bad-bg)', border: '1px solid var(--bad-border)' }}>
            <AlertCircle size={14} className="text-[var(--bad)] mt-0.5 shrink-0" />
            <p className="text-[13px] text-[var(--fg)]">{error}</p>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="Subject"
            placeholder="e.g. HWID reset needed after PC build"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            maxLength={120}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--fg-dim)] font-medium">Category</label>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--fg-dim)] font-medium">Priority</label>
              <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-[var(--fg-dim)] font-medium">Describe the issue</label>
            <textarea
              className="input"
              rows={8}
              placeholder="Include what tool, what you tried, what you expected, what happened..."
              value={body}
              onChange={e => setBody(e.target.value)}
              required
            />
          </div>

          <p className="text-[11px] text-[var(--fg-mute)]">
            Your account email and current state are attached automatically.
          </p>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--hairline)]">
            <Link href="/dashboard/tickets" className="btn btn-ghost btn-sm">Cancel</Link>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={loading ? undefined : <Send size={13} />}
              disabled={!subject.trim() || !body.trim()}
            >
              {loading ? 'Opening...' : 'Open ticket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
