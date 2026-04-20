import { useMemo } from 'react'
import type { Currency, TransferResult } from './types'
import { formatCurrency } from './utils'

export interface ReceiptProps {
  result: TransferResult
  amount: number
  fromCurrency: Currency
  toCurrency: Currency
  recipientName: string
  iban: string
  onReset: () => void
}

export function Receipt({
  result, amount, fromCurrency, toCurrency, recipientName, iban, onReset,
}: ReceiptProps) {
  const sentAt = useMemo(() => (
    new Date().toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  ), [])

  return (
    <section className="receipt" data-testid="transfer-result">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <div className="success-dot">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 6.5 5 9l4.5-6" />
            </svg>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-positive">
            Transfer initiated
          </p>
        </div>

        <div className="mt-4 flex items-baseline flex-wrap gap-x-3 gap-y-1">
          <span className="font-mono tabular-nums text-[14px] text-muted">
            {formatCurrency(amount, fromCurrency)}
          </span>
          <svg width="14" height="8" viewBox="0 0 16 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-subtle">
            <path d="M0 4h14M11 1l3 3-3 3" />
          </svg>
          <span
            data-testid="converted-amount"
            className="amount-reveal font-mono tabular-nums text-[34px] font-semibold tracking-[-0.025em] text-ink"
          >
            {formatCurrency(result.convertedAmount, toCurrency)}{' '}
            <span className="text-[15px] font-medium text-muted tracking-normal">{toCurrency}</span>
          </span>
        </div>
        <p className="mt-2 text-[12px] text-muted">Sent {sentAt}</p>
      </div>

      <dl className="px-6 divide-y divide-border">
        <ReceiptRow label="Recipient" value={recipientName || '—'} />
        <ReceiptRow label="IBAN" value={iban} mono />
        <ReceiptRow label="Rate" value={`1 ${fromCurrency} = ${result.rate} ${toCurrency}`} mono />
        <ReceiptRow label="Reference" value={result.transferId} mono />
      </dl>

      <div className="flex items-center justify-between gap-4 border-t border-dashed border-border px-6 py-4">
        <p className="text-[12px] text-muted">Funds arrive in 1–2 business days.</p>
        <button type="button" onClick={onReset} className="ghost">
          Send another →
        </button>
      </div>
    </section>
  )
}

export interface ReceiptRowProps { label: string; value: string; mono?: boolean }

export function ReceiptRow({ label, value, mono }: ReceiptRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted shrink-0">{label}</dt>
      <dd className={`text-[13px] text-ink text-right break-all${mono ? ' font-mono tabular-nums' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
