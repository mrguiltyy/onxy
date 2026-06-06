import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function formatDate(d: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))
}

export function relativeTime(d: string | Date): string {
  const secs = (Date.now() - new Date(d).getTime()) / 1000
  if (secs < 60)     return 'just now'
  if (secs < 3600)   return `${Math.floor(secs / 60)} min ago`
  if (secs < 86400)  return `${Math.floor(secs / 3600)} h ago`
  if (secs < 86400 * 7)  return `${Math.floor(secs / 86400)} days ago`
  return formatDate(d)
}

export function generateLicenseKey(): { full: string; prefix: string } {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const seg = (len: number) =>
    Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  const full = `${seg(6)}-${seg(6)}-${seg(7)}`
  return { full, prefix: full.split('-')[0] }
}
