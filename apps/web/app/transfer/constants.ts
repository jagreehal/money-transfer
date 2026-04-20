import type { Currency } from './types'

export const currencyMeta: Record<Currency, { symbol: string; locale: string; flag: string }> = {
  GBP: { symbol: '\u00A3', locale: 'en-GB', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  EUR: { symbol: '\u20AC', locale: 'en-IE', flag: '\uD83C\uDDEA\uD83C\uDDFA' },
  USD: { symbol: '$',      locale: 'en-US', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
}

// Indicative mid-market rates for the live preview.
// The backend returns the authoritative rate on submit.
export const previewRates: Record<Currency, Record<Currency, number>> = {
  GBP: { GBP: 1,     EUR: 1.186, USD: 1.268 },
  EUR: { GBP: 0.843, EUR: 1,     USD: 1.069 },
  USD: { GBP: 0.789, EUR: 0.935, USD: 1     },
}

export const FEE_BPS = 35 // 0.35% transparent fee, paid in source currency
