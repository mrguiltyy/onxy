/**
 * Thin façade over the email module so other code only needs to
 * import from `@/lib/email` and pick a helper.
 */
import { sendEmail } from './client'
import {
  welcomeEmail, passwordResetEmail, loginAlertEmail,
  purchaseReceiptEmail, expiringSoonEmail, discountCodeEmail,
} from './templates'

export async function sendWelcome(to: string, username: string, verifyUrl: string) {
  const { subject, html } = welcomeEmail(username, verifyUrl)
  return sendEmail({ to, subject, html, tag: 'welcome' })
}

export async function sendPasswordReset(to: string, username: string, resetUrl: string) {
  const { subject, html } = passwordResetEmail(username, resetUrl)
  return sendEmail({ to, subject, html, tag: 'password-reset' })
}

export async function sendLoginAlert(to: string, username: string, ip: string, ua: string, location: string) {
  const { subject, html } = loginAlertEmail(username, ip, ua, location)
  return sendEmail({ to, subject, html, tag: 'login-alert' })
}

export async function sendPurchaseReceipt(to: string, opts: Parameters<typeof purchaseReceiptEmail>[0]) {
  const { subject, html } = purchaseReceiptEmail(opts)
  return sendEmail({ to, subject, html, tag: 'purchase-receipt' })
}

export async function sendExpiringSoon(to: string, username: string, productName: string, daysLeft: number) {
  const { subject, html } = expiringSoonEmail(username, productName, daysLeft)
  return sendEmail({ to, subject, html, tag: 'expiring-soon' })
}

export async function sendDiscountCode(to: string, opts: Parameters<typeof discountCodeEmail>[0]) {
  const { subject, html } = discountCodeEmail(opts)
  return sendEmail({ to, subject, html, tag: 'discount-code' })
}

export { sendEmail } from './client'
