/**
 * Discord webhook fan-out.
 *
 * Set DISCORD_WEBHOOK_URL in .env.local to a Discord channel webhook URL.
 * Calls become no-ops if no URL is configured — never throws.
 *
 * Use sparingly — Discord rate-limits webhooks to ~30 messages/min per channel.
 */

interface EmbedField { name: string; value: string; inline?: boolean }
interface Embed {
  title?:       string
  description?: string
  color?:       number       // decimal RGB
  url?:         string
  fields?:      EmbedField[]
  timestamp?:   string
  footer?:      { text: string }
}

interface DiscordMessage {
  content?:  string
  username?: string
  embeds?:   Embed[]
}

const COLOR = {
  brand: 0xc5b3df,
  ok:    0x22c55e,
  warn:  0xfacc15,
  bad:   0xef4444,
  info:  0x3b82f6,
} as const

export async function discordNotify(msg: DiscordMessage): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'OP', ...msg }),
    })
  } catch {
    // best effort — never block business logic on webhook delivery
  }
}

// Pre-built event templates
export async function notifyNewSale(opts: {
  user_username: string; user_email: string; amount_cents: number; description: string; total_user_spent: number
}) {
  return discordNotify({
    embeds: [{
      title:       '💰 New sale',
      description: opts.description,
      color:       COLOR.ok,
      fields: [
        { name: 'User',          value: `${opts.user_username} (${opts.user_email})`, inline: true },
        { name: 'Amount',        value: `$${(opts.amount_cents / 100).toFixed(2)}`,    inline: true },
        { name: 'Lifetime spent',value: `$${(opts.total_user_spent / 100).toFixed(2)}`,inline: true },
      ],
      timestamp: new Date().toISOString(),
    }],
  })
}

export async function notifyNewSignup(opts: {
  user_username: string; user_email: string; via: string; signup_ip?: string | null
}) {
  return discordNotify({
    embeds: [{
      title:       '✨ New user',
      description: `**${opts.user_username}** signed up via ${opts.via}`,
      color:       COLOR.info,
      fields: [
        { name: 'Email', value: opts.user_email,                inline: true },
        ...(opts.signup_ip ? [{ name: 'IP', value: opts.signup_ip, inline: true }] : []),
      ],
      timestamp: new Date().toISOString(),
    }],
  })
}

export async function notifyNewTicket(opts: {
  user_username: string; subject: string; category: string; ticket_id: string; is_priority: boolean; site_url: string
}) {
  return discordNotify({
    embeds: [{
      title:       `🎫 ${opts.is_priority ? 'PRIORITY ' : ''}Ticket: ${opts.subject}`,
      url:         `${opts.site_url}/admin/tickets/${opts.ticket_id}`,
      color:       opts.is_priority ? COLOR.warn : COLOR.brand,
      fields: [
        { name: 'From',     value: opts.user_username, inline: true },
        { name: 'Category', value: opts.category,      inline: true },
      ],
      timestamp: new Date().toISOString(),
    }],
  })
}

export async function notifyResellerApplication(opts: {
  user_username: string; product_name: string; custom_name: string; pitch: string; site_url: string
}) {
  return discordNotify({
    embeds: [{
      title:       `🛒 Reseller application: ${opts.custom_name}`,
      description: opts.pitch.slice(0, 1500),
      url:         `${opts.site_url}/admin/resellers`,
      color:       COLOR.brand,
      fields: [
        { name: 'Applicant', value: opts.user_username, inline: true },
        { name: 'Product',   value: opts.product_name,  inline: true },
      ],
      timestamp: new Date().toISOString(),
    }],
  })
}

export async function notifyResellerPurchase(opts: {
  user_username: string; plan_name: string; cycle: string; amount_cents: number
}) {
  return discordNotify({
    embeds: [{
      title:       '🏆 New reseller',
      description: `**${opts.user_username}** purchased **${opts.plan_name}** (${opts.cycle})`,
      color:       COLOR.ok,
      fields: [
        { name: 'Amount', value: `$${(opts.amount_cents / 100).toFixed(2)}`, inline: true },
      ],
      timestamp: new Date().toISOString(),
    }],
  })
}
