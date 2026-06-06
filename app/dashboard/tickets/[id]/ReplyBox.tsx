'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabaseBrowser } from '@/lib/supabase/client'

export function ReplyBox({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const [body,    setBody]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true); setError(null)

    try {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not signed in.'); setLoading(false); return }

      const { error: insertErr } = await supabase.from('ticket_messages').insert({
        ticket_id:   ticketId,
        author_id:   user.id,
        is_admin:    false,
        is_internal: false,
        body:        body.trim(),
      } as never)

      if (insertErr) { setError(insertErr.message); setLoading(false); return }

      await supabase
        .from('tickets')
        .update({ status: 'open', last_reply_at: new Date().toISOString() } as never)
        .eq('id', ticketId)

      setBody('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={send} className="card p-5">
      <p className="text-[13px] font-semibold mb-3">Reply</p>
      {error && <p className="text-[12.5px] text-[var(--bad)] mb-3">{error}</p>}
      <textarea
        className="input"
        rows={5}
        placeholder="Add to the thread..."
        value={body}
        onChange={e => setBody(e.target.value)}
      />
      <div className="flex items-center justify-end mt-3">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          icon={loading ? undefined : <Send size={13} />}
          disabled={!body.trim()}
        >
          {loading ? 'Sending...' : 'Send reply'}
        </Button>
      </div>
    </form>
  )
}
