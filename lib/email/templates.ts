/**
 * Email template renderer.
 *
 * All templates share a single wrapper for consistent branding.
 * Inline styles only — Resend / Gmail / Outlook discard <style> blocks.
 */

const PRIMARY  = '#ff3a00'
const FG       = '#fafaf7'
const FG_DIM   = '#a3a39e'
const BG       = '#0a0907'
const SURFACE  = '#16140f'
const HAIRLINE = '#211d18'

function wrap(opts: {
  preheader:  string
  heading:    string
  body:       string
  ctaLabel?:  string
  ctaUrl?:    string
}): string {
  const cta = opts.ctaLabel && opts.ctaUrl
    ? `<a href="${opts.ctaUrl}" style="display:inline-block;background:${PRIMARY};color:${BG};font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">${opts.ctaLabel}</a>`
    : ''

  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${FG};">
  <span style="display:none!important;color:transparent;font-size:1px;height:0;width:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.preheader}</span>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BG};">
    <tr><td align="center" style="padding:48px 24px;">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;">

        <!-- Wordmark -->
        <tr><td style="padding-bottom:32px;">
          <span style="font-weight:600;font-size:15px;color:${FG};letter-spacing:-0.01em;">Onyx</span>
          <span style="font-family:Menlo,Consolas,monospace;font-size:10.5px;color:${FG_DIM};letter-spacing:0.18em;text-transform:uppercase;margin-left:8px;">Services</span>
        </td></tr>

        <!-- Heading -->
        <tr><td style="padding-bottom:16px;">
          <h1 style="margin:0;font-weight:500;font-size:32px;line-height:1.1;letter-spacing:-0.025em;color:${FG};">${opts.heading}</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding-bottom:32px;">
          <div style="color:${FG_DIM};font-size:15px;line-height:1.6;">${opts.body}</div>
        </td></tr>

        ${cta ? `<tr><td style="padding-bottom:32px;">${cta}</td></tr>` : ''}

        <!-- Footer -->
        <tr><td style="padding-top:32px;border-top:1px solid ${HAIRLINE};">
          <p style="margin:0;font-family:Menlo,Consolas,monospace;font-size:10.5px;color:${FG_DIM};letter-spacing:0.14em;text-transform:uppercase;">
            Sent by Onyx Services · onyx.gg
          </p>
          <p style="margin:8px 0 0;font-size:11.5px;color:${FG_DIM};">
            You're receiving this because you have an active Onyx account.
            Manage notifications in your <a href="https://onyx.gg/dashboard/security" style="color:${PRIMARY};">security settings</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

/* ════════════════════════════════════════════════════════════════
   TEMPLATES — one function per transactional event
   ════════════════════════════════════════════════════════════════ */

export function welcomeEmail(username: string, verifyUrl: string) {
  return {
    subject: 'Welcome to Onyx Services',
    html: wrap({
      preheader: 'Verify your email to activate your account.',
      heading:   `Welcome, ${username}.`,
      body: `
        <p>Your account is ready. Confirm your email below to unlock the arsenal and start using your wallet.</p>
        <p style="margin-top:12px;font-size:13.5px;color:#6e6e68;">The link expires in 24 hours.</p>
      `,
      ctaLabel: 'Confirm email',
      ctaUrl:   verifyUrl,
    }),
  }
}

export function passwordResetEmail(username: string, resetUrl: string) {
  return {
    subject: 'Reset your Onyx password',
    html: wrap({
      preheader: 'Click the button to reset your password.',
      heading:   'Reset your password',
      body: `
        <p>Hi ${username} — we received a request to reset your password. Click below to choose a new one.</p>
        <p style="margin-top:12px;font-size:13.5px;color:#6e6e68;">If you didn't request this, you can ignore this email. The link expires in 1 hour.</p>
      `,
      ctaLabel: 'Reset password',
      ctaUrl:   resetUrl,
    }),
  }
}

export function loginAlertEmail(username: string, ip: string, ua: string, location: string) {
  return {
    subject: 'New sign-in to your Onyx account',
    html: wrap({
      preheader: `Sign-in from ${location}`,
      heading:   'New sign-in detected',
      body: `
        <p>Hi ${username} — someone just signed in to your account.</p>
        <table cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;font-size:13.5px;color:${FG_DIM};">
          <tr><td style="padding:4px 16px 4px 0;color:#6e6e68;">Location</td><td style="color:${FG};">${location}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#6e6e68;">IP</td><td style="color:${FG};font-family:Menlo,Consolas,monospace;">${ip}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#6e6e68;">Device</td><td style="color:${FG};">${ua}</td></tr>
        </table>
        <p style="margin-top:16px;">If this wasn't you, change your password immediately and contact support.</p>
      `,
      ctaLabel: 'Review security',
      ctaUrl:   'https://onyx.gg/dashboard/security',
    }),
  }
}

export function purchaseReceiptEmail(opts: {
  username:    string
  productName: string
  planLabel:   string
  amountCents: number
  orderId:     string
  licenseKey:  string                 // shown ONCE here, then user views in dashboard
}) {
  return {
    subject: `Receipt — Onyx ${opts.productName}`,
    html: wrap({
      preheader: `Your ${opts.productName} license is ready.`,
      heading:   'Purchase confirmed',
      body: `
        <p>Hi ${opts.username} — thanks for your order.</p>
        <table cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;width:100%;background:${SURFACE};border:1px solid ${HAIRLINE};border-radius:6px;">
          <tr><td style="padding:16px;">
            <p style="margin:0;font-family:Menlo,Consolas,monospace;font-size:10.5px;color:#6e6e68;letter-spacing:0.14em;text-transform:uppercase;">Product</p>
            <p style="margin:4px 0 12px;font-size:18px;color:${FG};">Onyx ${opts.productName} — ${opts.planLabel}</p>

            <p style="margin:0;font-family:Menlo,Consolas,monospace;font-size:10.5px;color:#6e6e68;letter-spacing:0.14em;text-transform:uppercase;">Total</p>
            <p style="margin:4px 0 12px;font-size:18px;color:${PRIMARY};">$${(opts.amountCents / 100).toFixed(2)}</p>

            <p style="margin:0;font-family:Menlo,Consolas,monospace;font-size:10.5px;color:#6e6e68;letter-spacing:0.14em;text-transform:uppercase;">License key</p>
            <p style="margin:4px 0 0;font-family:Menlo,Consolas,monospace;font-size:14px;color:${PRIMARY};letter-spacing:0.06em;">${opts.licenseKey}</p>
          </td></tr>
        </table>
        <p style="margin-top:16px;font-size:13.5px;color:#6e6e68;">Order ${opts.orderId}. This key is also available in your dashboard library. Do not share it.</p>
      `,
      ctaLabel: 'Open library',
      ctaUrl:   'https://onyx.gg/dashboard/library',
    }),
  }
}

export function expiringSoonEmail(username: string, productName: string, daysLeft: number) {
  return {
    subject: `Your Onyx ${productName} expires in ${daysLeft} days`,
    html: wrap({
      preheader: `Renew before ${daysLeft} days are up to keep access.`,
      heading:   'License expiring soon',
      body: `
        <p>Hi ${username} — your <strong style="color:${FG};">Onyx ${productName}</strong> license expires in <strong style="color:${PRIMARY};">${daysLeft} days</strong>.</p>
        <p>Renew now to avoid losing access. Auto-renew can be enabled in the subscriptions page.</p>
      `,
      ctaLabel: 'Renew license',
      ctaUrl:   'https://onyx.gg/dashboard/subscriptions',
    }),
  }
}

export function discountCodeEmail(opts: {
  username:    string
  code:        string
  percentOff:  number
  productName?: string
  expiresIn:   string
}) {
  return {
    subject: `${opts.percentOff}% off — your Onyx code is inside`,
    html: wrap({
      preheader: `Use code ${opts.code} — expires in ${opts.expiresIn}.`,
      heading:   'A code, just for you',
      body: `
        <p>Hi ${opts.username} — here's <strong style="color:${PRIMARY};">${opts.percentOff}% off</strong>${opts.productName ? ` your next ${opts.productName} purchase` : ''}.</p>
        <p style="margin-top:16px;padding:16px;background:${SURFACE};border:1px dashed ${PRIMARY};border-radius:6px;font-family:Menlo,Consolas,monospace;font-size:18px;color:${PRIMARY};letter-spacing:0.12em;text-align:center;">
          ${opts.code}
        </p>
        <p style="margin-top:12px;font-size:13.5px;color:#6e6e68;">Apply at checkout. Expires in ${opts.expiresIn}.</p>
      `,
      ctaLabel: 'Browse the arsenal',
      ctaUrl:   'https://onyx.gg/shop',
    }),
  }
}
