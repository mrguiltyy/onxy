import { Megaphone, Power, PowerOff } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/server'
import { Pill } from '@/components/ui/Pill'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { relativeTime } from '@/lib/utils'
import { createAnnouncement, toggleAnnouncement } from './actions'

interface Announcement {
  id:         string
  message:    string
  variant:    string
  link_url:   string | null
  link_label: string | null
  is_active:  boolean
  created_at: string
}

export default async function AdminAnnouncementsPage() {
  const { data } = await supabaseAdmin()
    .from('announcements')
    .select('id, message, variant, link_url, link_label, is_active, created_at')
    .order('created_at', { ascending: false })

  const list = (data ?? []) as Announcement[]

  return (
    <div className="animate-in max-w-[820px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight">Announcements</h1>
        <p className="text-[13px] text-[var(--fg-dim)] mt-0.5">
          Post a banner across every signed-in dashboard. Posting a new one auto-deactivates older ones.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <p className="label-mono mb-4">Post new</p>
        <form action={createAnnouncement} className="flex flex-col gap-3">
          <Input
            name="message"
            label="Message"
            placeholder="e.g. License server maintenance Sunday 2 AM UTC"
            required
            maxLength={200}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-[var(--fg-dim)] font-medium">Variant</label>
              <select name="variant" className="input" defaultValue="info">
                <option value="info">Info (blue)</option>
                <option value="warn">Warning (yellow)</option>
                <option value="success">Success (green)</option>
                <option value="brand">Brand (blue)</option>
              </select>
            </div>
            <Input name="link_url"   label="Link URL (optional)"   placeholder="https://..." />
            <Input name="link_label" label="Link label (optional)" placeholder="Learn more" />
          </div>

          <div className="flex justify-end pt-2 border-t border-[var(--hairline)]">
            <Button type="submit" variant="primary" icon={<Megaphone size={13} />}>Post announcement</Button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--hairline)]">
          <p className="label-mono">History</p>
        </div>
        {list.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-[var(--fg-mute)]">
            No announcements yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--hairline)]">
            {list.map(a => (
              <div key={a.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <VariantPill variant={a.variant} />
                    {a.is_active ? <Pill tone="ok">Active</Pill> : <Pill tone="warn">Inactive</Pill>}
                    <span className="text-[11px] text-[var(--fg-mute)]">{relativeTime(a.created_at)}</span>
                  </div>
                  <p className="text-[13.5px] text-[var(--fg)]">{a.message}</p>
                  {a.link_url && (
                    <p className="text-[11.5px] text-[var(--fg-mute)] mt-1">
                      Link: <code className="text-[var(--brand)]">{a.link_url}</code>
                      {a.link_label && <span> ({a.link_label})</span>}
                    </p>
                  )}
                </div>
                <form action={toggleAnnouncement}>
                  <input type="hidden" name="id"     value={a.id} />
                  <input type="hidden" name="active" value={String(a.is_active)} />
                  <Button type="submit" variant="outline" size="sm" icon={a.is_active ? <PowerOff size={11} /> : <Power size={11} />}>
                    {a.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VariantPill({ variant }: { variant: string }) {
  const tone = variant === 'warn' ? 'warn' : variant === 'success' ? 'ok' : 'brand'
  return <Pill tone={tone}>{variant}</Pill>
}
