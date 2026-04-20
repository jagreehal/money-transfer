import type { Currency } from './types'
import { currencyMeta } from './constants'

export function formatCurrency(value: number, currency: Currency) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(currencyMeta[currency].locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number, currency: Currency) {
  if (!Number.isFinite(value)) return '0.00'
  return new Intl.NumberFormat(currencyMeta[currency].locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const IBAN_NON_ALPHANUM = /[^A-Z0-9]/gi
const IBAN_GROUPS_OF_4 = /(.{4})/g

export function formatIban(raw: string) {
  const clean = raw.replace(IBAN_NON_ALPHANUM, '').toUpperCase().slice(0, 34)
  return clean.replace(IBAN_GROUPS_OF_4, '$1 ').trim()
}

export function ibanLength(raw: string) {
  return raw.replace(IBAN_NON_ALPHANUM, '').length
}

export function addBusinessDays(base: Date, days: number) {
  const d = new Date(base)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return d
}
