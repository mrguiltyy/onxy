'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

export default function NewTicketPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [subject,  setSubject]  = useState('')
  const [category, setCategory] = useState('Technical')
  const [priority, setPriority] = useState('medium')
  const [body,     setBody]     = useState('')
  const [loading,  setLoading]  = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    toast({ title: 'Ticket opened', description: 'Our team will respond shortly.', variant: 'success' })
    router.push('/dashboard/tickets')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard/tickets" className="inline-flex items-center gap-1 text-[var(--fg-mute)] hover:text-[var(--fg)] text-sm mb-4 transition-colors">
        <ChevronLeft size={14} /> Back to tickets
      </Link>

      <div className="mb-8">
        <h1 className="text-white font-bold text-2xl tracking-tight">Open a ticket</h1>
        <p className="text-[var(--fg-dim)] text-sm mt-1">We respond fastest to tickets with specific subjects and clear detail.</p>
      </div>

      <Card className="p-6">
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
            <Select
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { value: 'Technical',  label: 'Technical issue' },
                { value: 'HWID Reset', label: 'HWID reset'      },
                { value: 'Billing',    label: 'Billing'         },
                { value: 'General',    label: 'General question' },
              ]}
            />
            <Select
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={[
                { value: 'low',    label: 'Low — when you have time' },
                { value: 'medium', label: 'Medium — within a day'    },
                { value: 'high',   label: 'High — blocking my work'  },
              ]}
            />
          </div>

          <Textarea
            label="Describe the issue"
            rows={8}
            placeholder="Include what tool, what you tried, what you expected, what happened..."
            value={body}
            onChange={e => setBody(e.target.value)}
            required
          />

          <p className="text-[10.5px] text-[var(--fg-mute)]">
            Your account email, current IP, and any active license context are attached automatically.
          </p>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--hairline)]">
            <Link href="/dashboard/tickets" className="btn btn-ghost">Cancel</Link>
            <Button type="submit" variant="primary" loading={loading} icon={<Send size={13} />} disabled={!subject.trim() || !body.trim()}>
              {loading ? 'Opening...' : 'Open ticket'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
