import crypto from 'crypto'

/**
 * NOWPayments client — auto-accepts BTC / ETH / USDT / SOL / LTC / DOGE / 150+ coins.
 * Funds auto-convert to stable so we don't carry volatility.
 *
 * Required env vars:
 *   NOWPAYMENTS_API_KEY      — from dashboard → Store settings → API keys
 *   NOWPAYMENTS_IPN_SECRET   — from Store settings → IPN secret key
 *
 * Optional:
 *   NOWPAYMENTS_SANDBOX      — set to "1" to use sandbox endpoint while testing
 */

const PROD_BASE = 'https://api.nowpayments.io/v1'
const SANDBOX_BASE = 'https://api-sandbox.nowpayments.io/v1'

function base() {
  return process.env.NOWPAYMENTS_SANDBOX === '1' ? SANDBOX_BASE : PROD_BASE
}

export function isCryptoConfigured(): boolean {
  return !!process.env.NOWPAYMENTS_API_KEY && !!process.env.NOWPAYMENTS_IPN_SECRET
}

export interface CreatePaymentInput {
  price_amount:     number     // USD amount (we always price in USD)
  pay_currency:     string     // 'btc' | 'eth' | 'usdttrc20' | 'sol' | 'ltc' | ...
  order_id:         string     // our internal order/transaction id
  order_description?: string
  ipn_callback_url: string
  success_url?:     string
  cancel_url?:      string
}

export interface CreatedPayment {
  payment_id:           string
  pay_address:          string
  pay_amount:           number
  pay_currency:         string
  price_amount:         number
  price_currency:       string
  payment_status:       string   // 'waiting' | 'confirming' | 'confirmed' | 'finished' | 'failed' | 'refunded' | 'expired'
  order_id:             string
  created_at:           string
  network?:             string
  network_precision?:   number
  time_limit?:          string
  expiration_estimate_date?: string
}

export async function createPayment(input: CreatePaymentInput): Promise<{ ok: true; data: CreatedPayment } | { ok: false; error: string }> {
  const key = process.env.NOWPAYMENTS_API_KEY
  if (!key) return { ok: false, error: 'NOWPAYMENTS_API_KEY not configured' }

  try {
    const res = await fetch(`${base()}/payment`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify({
        price_amount:      input.price_amount,
        price_currency:    'usd',
        pay_currency:      input.pay_currency,
        order_id:          input.order_id,
        order_description: input.order_description ?? `OP order ${input.order_id}`,
        ipn_callback_url:  input.ipn_callback_url,
        success_url:       input.success_url,
        cancel_url:        input.cancel_url,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data?.message ?? `NOWPayments responded ${res.status}` }
    }
    return { ok: true, data: data as CreatedPayment }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

export async function getPaymentStatus(paymentId: string): Promise<{ ok: true; status: string; data: CreatedPayment } | { ok: false; error: string }> {
  const key = process.env.NOWPAYMENTS_API_KEY
  if (!key) return { ok: false, error: 'not configured' }
  try {
    const res = await fetch(`${base()}/payment/${paymentId}`, {
      headers: { 'x-api-key': key },
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data?.message ?? `status ${res.status}` }
    return { ok: true, status: data.payment_status, data: data as CreatedPayment }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

/**
 * Verify an incoming IPN (Instant Payment Notification) signature.
 * Per NOWPayments docs: sort payload keys alphabetically, JSON.stringify,
 * HMAC-SHA512 with the IPN secret, compare to x-nowpayments-sig header.
 */
export function verifyIpnSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.NOWPAYMENTS_IPN_SECRET
  if (!secret) return false

  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>
    const sorted = sortObject(parsed)
    const expected = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(sorted))
      .digest('hex')
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

function sortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObject)
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      out[key] = sortObject((obj as Record<string, unknown>)[key])
    }
    return out
  }
  return obj
}

/** Currencies we show on the picker — covers ~99% of crypto users. */
export const SUPPORTED_CRYPTO: { code: string; label: string; min: number }[] = [
  { code: 'btc',         label: 'Bitcoin',           min: 10 },
  { code: 'eth',         label: 'Ethereum',          min: 10 },
  { code: 'usdttrc20',   label: 'USDT (TRC20)',      min: 5  },
  { code: 'usdterc20',   label: 'USDT (ERC20)',      min: 5  },
  { code: 'usdcerc20',   label: 'USDC (ERC20)',      min: 5  },
  { code: 'sol',         label: 'Solana',            min: 5  },
  { code: 'ltc',         label: 'Litecoin',          min: 5  },
  { code: 'doge',        label: 'Dogecoin',          min: 5  },
  { code: 'bnbbsc',      label: 'BNB (BSC)',         min: 5  },
  { code: 'trx',         label: 'Tron',              min: 5  },
  { code: 'matic',       label: 'Polygon (MATIC)',   min: 5  },
  { code: 'xmr',         label: 'Monero',            min: 5  },
]
