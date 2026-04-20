import { useMemo, useState } from 'react'
import type { Currency, TransferResult } from './types'
import { FEE_BPS, previewRates } from './constants'
import { addBusinessDays, formatIban, ibanLength } from './utils'

export interface TransferFormValues {
  recipientName: string
  iban: string
  amount: string
  fromCurrency: Currency
  toCurrency: Currency
  fee: number
  rate: number
  recipientGets: number
  arrival: string
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  serverError: string | null
  result: TransferResult | null
  setRecipientName: (v: string) => void
  setIban: (v: string) => void
  setAmount: (v: string) => void
  setFromCurrency: (c: Currency) => void
  setToCurrency: (c: Currency) => void
  swapCurrencies: () => void
  handleSubmit: (e: React.FormEvent) => void
  reset: () => void
  onBlurRecipientName: () => void
  onBlurIban: () => void
}

export function useTransferForm(): TransferFormValues {
  const [recipientName, setRecipientName] = useState('')
  const [iban, setIbanRaw] = useState('')
  const [amount, setAmount] = useState('1000')
  const [fromCurrency, setFromCurrencyRaw] = useState<Currency>('GBP')
  const [toCurrency, setToCurrencyRaw] = useState<Currency>('EUR')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [result, setResult] = useState<TransferResult | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const amountNum = parseFloat(amount) || 0
  const rate = previewRates[fromCurrency][toCurrency]
  const fee = +(amountNum * (FEE_BPS / 10000)).toFixed(2)
  const netSend = Math.max(0, +(amountNum - fee).toFixed(2))
  const recipientGets = +(netSend * rate).toFixed(2)

  const arrival = useMemo(() => {
    const d = addBusinessDays(new Date(), 1)
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }, [])

  function validateField(field: 'recipientName' | 'iban') {
    setErrors((prev) => {
      const next = { ...prev }
      if (field === 'recipientName') {
        if (!recipientName.trim()) next.recipientName = 'Recipient name is required'
        else delete next.recipientName
      }
      if (field === 'iban') {
        const len = ibanLength(iban)
        if (len === 0) next.iban = 'IBAN is required'
        else if (len < 15) next.iban = 'IBAN must be at least 15 characters'
        else if (len > 34) next.iban = 'IBAN must be at most 34 characters'
        else delete next.iban
      }
      return next
    })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!recipientName.trim()) e.recipientName = 'Recipient name is required'
    const len = ibanLength(iban)
    if (len === 0) e.iban = 'IBAN is required'
    else if (len < 15) e.iban = 'IBAN must be at least 15 characters'
    else if (len > 34) e.iban = 'IBAN must be at most 34 characters'
    if (!Number.isFinite(amountNum) || amountNum <= 0) e.amount = 'Enter a valid amount greater than 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault()
    setTouched({ recipientName: true, iban: true, amount: true })
    if (!validate()) return
    setServerError(null)
    setResult(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName,
          recipientIban: iban.replace(/\s/g, ''),
          amount: amountNum,
          fromCurrency,
          toCurrency,
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setResult({ convertedAmount: data.convertedAmount, rate: data.rate, transferId: data.transferId })
    } catch {
      setServerError('Transfer failed. Please check your inputs and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    recipientName,
    iban,
    amount,
    fromCurrency,
    toCurrency,
    fee,
    rate,
    recipientGets,
    arrival,
    errors,
    touched,
    isSubmitting,
    serverError,
    result,
    setRecipientName,
    setIban: (v: string) => setIbanRaw(formatIban(v)),
    setAmount,
    setFromCurrency: (next: Currency) => {
      if (next === toCurrency) setToCurrencyRaw(fromCurrency)
      setFromCurrencyRaw(next)
    },
    setToCurrency: (next: Currency) => {
      if (next === fromCurrency) setFromCurrencyRaw(toCurrency)
      setToCurrencyRaw(next)
    },
    swapCurrencies: () => {
      setFromCurrencyRaw(toCurrency)
      setToCurrencyRaw(fromCurrency)
    },
    handleSubmit,
    reset: () => { setResult(null); setServerError(null) },
    onBlurRecipientName: () => { if (Object.keys(touched).length > 0) validateField('recipientName') },
    onBlurIban: () => { if (Object.keys(touched).length > 0) validateField('iban') },
  }
}
