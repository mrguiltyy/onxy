/* ════════════════════════════════════════════════════════════════
   Shared types for Onyx Services
   These shapes drive every page, DB row, and API response.
   ════════════════════════════════════════════════════════════════ */

export type UserRole = 'user' | 'reseller' | 'support' | 'super_admin'

export type Tier = 'Onyx' | 'Slate' | 'Carbon' | 'Diamond' | 'Gold'

export interface User {
  id:                string
  username:          string
  email:             string
  walletBalance:     number       // cents
  role:              UserRole
  tier:              Tier
  totp:              boolean
  emailVerified:     boolean
  banned:            boolean
  referralCode:      string
  referredById?:     string | null
  createdAt:         string

  // Reseller-only fields (null/0 for normal users)
  reseller?: {
    approvedAt:         string
    discountPercent:    number     // default 75
    totalKeysGenerated: number
    totalKeysSold:      number
    totalRevenue:       number     // cents (lifetime)
    customRetailFloor?: number     // optional minimum sell price set by admin
  }
}

export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'sold' | 'unused'

export interface License {
  id:           string
  userId:       string
  productSlug:  string
  productName:  string
  planId:       'monthly' | 'quarterly' | 'lifetime'
  planLabel:    string
  key:          string
  status:       LicenseStatus
  autoRenew:    boolean
  hwidSlotsUsed:  number
  hwidSlotsTotal: number
  expiresAt:    string | null
  createdAt:    string
}

export interface ResellerKey {
  id:           string
  resellerId:   string
  productSlug:  string
  productName:  string
  planId:       'monthly' | 'quarterly' | 'lifetime'
  planLabel:    string
  key:          string
  costPaid:     number          // cents (after 75% discount)
  retailPrice:  number          // cents (full price)
  status:       'unused' | 'sold' | 'revoked'
  soldAt?:      string
  soldPrice?:   number          // cents (optional self-reported)
  buyerEmail?:  string
  createdAt:    string
}

export interface Subscription {
  id:               string
  userId:           string
  licenseId:        string
  productName:      string
  planLabel:        string
  amountCents:      number
  intervalDays:     number      // 30 / 90 / null=lifetime
  status:           'active' | 'cancelled' | 'past_due'
  autoRenew:        boolean
  nextBillingDate:  string
  paymentMethod:    'wallet' | 'card_visa' | 'card_mastercard'
  createdAt:        string
}

export interface ReferralReward {
  id:           string
  referrerId:   string
  referredUser: { username: string; joinedAt: string }
  spendCents:   number
  earnedCents:  number
  paidAt:       string
}
