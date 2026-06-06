import { Resend } from 'resend'

/**
 * Email sender. Uses Resend.
 * If RESEND_API_KEY is missing, logs a warning and no-ops so dev doesn't crash.
 */

let _client: Resend | null = null
function client() {
  if (_client) return _client
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  _client = new Resend(key)
  return _client
}

const FROM = process.env.EMAIL_FROM ?? 'OP <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://onxy.cc'

export interface SendEmailInput {
  to:      string | string[]
  subject: string
  html:    string
  text?:   string
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const c = client()
  if (!c) {
    console.warn('[email] RESEND_API_KEY missing — skipping send to', to)
    return { ok: false, skipped: true }
  }
  try {
    await c.emails.send({ from: FROM, to, subject, html, text })
    return { ok: true, skipped: false }
  } catch (err) {
    console.error('[email] send failed', err)
    return { ok: false, skipped: false, error: String(err) }
  }
}

/* ── Branded wrapper ───────────────────────────────────────────── */
function wrap(opts: {
  preheader: string
  heading:   string
  body:      string
  ctaLabel?: string
  ctaUrl?:   string
}): string {
  const cta = opts.ctaLabel && opts.ctaUrl
    ? `<tr><td style="padding-bottom:28px"><a href="${opts.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#f0a4b7 0%,#c5b3df 50%,#a2c8ee 100%);color:#3a2630;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none">${opts.ctaLabel}</a></td></tr>`
    : ''
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e8eaed">
<span style="display:none!important;color:transparent;font-size:1px;height:0;width:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden">${opts.preheader}</span>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0a0d14">
  <tr><td align="center" style="padding:48px 24px">
    <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%">
      <tr><td style="padding-bottom:32px">
        <span style="font-weight:900;font-size:24px;letter-spacing:-1px;background:linear-gradient(135deg,#f0a4b7 0%,#c5b3df 50%,#a2c8ee 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent">OP</span>
        <span style="margin-left:8px;font-family:Menlo,Consolas,monospace;font-size:10.5px;color:#9aa3b3;letter-spacing:0.2em;text-transform:uppercase">Panel</span>
      </td></tr>
      <tr><td style="padding-bottom:16px"><h1 style="margin:0;font-weight:600;font-size:26px;line-height:1.2;letter-spacing:-0.02em;color:#e8eaed">${opts.heading}</h1></td></tr>
      <tr><td style="padding-bottom:28px"><div style="color:#9aa3b3;font-size:15px;line-height:1.6">${opts.body}</div></td></tr>
      ${cta}
      <tr><td style="padding-top:28px;border-top:1px solid #2a3142">
        <p style="margin:0;font-family:Menlo,Consolas,monospace;font-size:10.5px;color:#6b7280;letter-spacing:0.14em;text-transform:uppercase">OP · onxy.cc</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

/* ── Templates ─────────────────────────────────────────────────── */

export async function emailTicketReply(toEmail: string, username: string, ticketId: string, subject: string, replyBody: string) {
  const safeBody = replyBody.length > 500 ? replyBody.slice(0, 500) + '…' : replyBody
  const escaped  = safeBody.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  const link     = `${APP_URL}/dashboard/tickets/${ticketId}`
  return sendEmail({
    to: toEmail,
    subject: `Re: ${subject}`,
    html: wrap({
      preheader: 'New reply from the OP team.',
      heading:   'Support replied',
      body: `
        <p>Hi ${username} — your support ticket has a new reply.</p>
        <p style="margin-top:16px;padding:16px;background:#131826;border-left:3px solid #f0a4b7;border-radius:4px;font-size:14px;color:#e8eaed">${escaped}</p>
      `,
      ctaLabel: 'View ticket',
      ctaUrl:   link,
    }),
  })
}

export async function emailTicketClosed(toEmail: string, username: string, ticketId: string, subject: string) {
  return sendEmail({
    to: toEmail,
    subject: `Closed: ${subject}`,
    html: wrap({
      preheader: 'Your ticket was marked resolved.',
      heading:   'Ticket closed',
      body: `<p>Hi ${username} — your ticket "<strong style="color:#e8eaed">${subject}</strong>" has been marked as resolved. If you still need help, reply on the ticket and we'll reopen it.</p>`,
      ctaLabel:  'View ticket',
      ctaUrl:    `${APP_URL}/dashboard/tickets/${ticketId}`,
    }),
  })
}

export async function emailTicketCreated(adminEmail: string, username: string, ticketId: string, subject: string) {
  return sendEmail({
    to: adminEmail,
    subject: `[Onyx] New ticket: ${subject}`,
    html: wrap({
      preheader: `New ticket from ${username}`,
      heading:   'New support ticket',
      body: `<p>${username} opened a new ticket: "<strong style="color:#e8eaed">${subject}</strong>"</p>`,
      ctaLabel:  'Open inbox',
      ctaUrl:    `${APP_URL}/admin/tickets/${ticketId}`,
    }),
  })
}
