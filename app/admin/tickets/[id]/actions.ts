'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { emailTicketReply, emailTicketClosed } from '@/lib/email'

interface AdminRole { role: string }
interface CustomerInfo { email: string; username: string }
interface TicketInfo { subject: string; user_id: string }

async function requireAdmin() {
  const supabase = await supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single<AdminRole>()
  if (!data || (data.role !== 'super_admin' && data.role !== 'support')) {
    redirect('/dashboard')
  }
  return user
}

export async function replyToTicket(formData: FormData) {
  const user = await requireAdmin()
  const ticketId = formData.get('ticketId') as string
  const body     = (formData.get('body') as string).trim()
  const internal = formData.get('internal') === 'on'

  if (!ticketId || !body) return

  const db = supabaseAdmin()

  // Insert message
  await db.from('ticket_messages').insert({
    ticket_id:   ticketId,
    author_id:   user.id,
    is_admin:    true,
    is_internal: internal,
    body,
  } as never)

  // Update ticket status to 'replied' if customer-facing reply
  if (!internal) {
    await db
      .from('tickets')
      .update({ status: 'replied', last_reply_at: new Date().toISOString() } as never)
      .eq('id', ticketId)

    // Look up customer email + subject
    const { data: ticketRaw } = await db
      .from('tickets')
      .select('subject, user_id')
      .eq('id', ticketId)
      .single<TicketInfo>()

    if (ticketRaw) {
      const { data: profileRaw } = await db
        .from('profiles')
        .select('email, username')
        .eq('id', ticketRaw.user_id)
        .single<CustomerInfo>()

      if (profileRaw?.email) {
        await emailTicketReply(profileRaw.email, profileRaw.username, ticketId, ticketRaw.subject, body)
      }
    }
  }

  revalidatePath(`/admin/tickets/${ticketId}`)
}

export async function closeTicket(formData: FormData) {
  await requireAdmin()
  const ticketId = formData.get('ticketId') as string
  if (!ticketId) return

  const db = supabaseAdmin()

  await db
    .from('tickets')
    .update({ status: 'closed', closed_at: new Date().toISOString() } as never)
    .eq('id', ticketId)

  // Notify customer
  const { data: ticketRaw } = await db
    .from('tickets')
    .select('subject, user_id')
    .eq('id', ticketId)
    .single<TicketInfo>()

  if (ticketRaw) {
    const { data: profileRaw } = await db
      .from('profiles')
      .select('email, username')
      .eq('id', ticketRaw.user_id)
      .single<CustomerInfo>()

    if (profileRaw?.email) {
      await emailTicketClosed(profileRaw.email, profileRaw.username, ticketId, ticketRaw.subject)
    }
  }

  revalidatePath(`/admin/tickets/${ticketId}`)
}

export async function reopenTicket(formData: FormData) {
  await requireAdmin()
  const ticketId = formData.get('ticketId') as string
  if (!ticketId) return

  await supabaseAdmin()
    .from('tickets')
    .update({ status: 'open', closed_at: null } as never)
    .eq('id', ticketId)

  revalidatePath(`/admin/tickets/${ticketId}`)
}
