import { currencies } from './types'
import type { Currency } from './types'
import type { TransferFormValues } from './useTransferForm'
import { currencyMeta } from './constants'
import { formatCurrency, formatNumber } from './utils'

export type TransferFormProps = Omit<TransferFormValues, 'result' | 'reset'>

const swapIcon = (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h10M10 2l4 4-4 4" />
    <path d="M13 10H3M6 14l-4-4 4-4" />
  </svg>
)

const submitArrow = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="opacity-70" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
)

const lockIcon = (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="mt-[3px] shrink-0" aria-hidden>
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5 7V5a3 3 0 016 0v2" />
  </svg>
)

const errorIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mt-[2px] shrink-0">
    <circle cx="8" cy="8" r="6.4" />
    <path d="M8 5v3.5M8 10.5v.5" />
  </svg>
)

export function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className={`mt-0.5 text-[13px] text-ink${mono ? ' font-mono tabular-nums' : ''}`}>{value}</div>
    </div>
  )
}

export function TransferForm({
  recipientName, iban, amount, fromCurrency, toCurrency,
  fee, rate, recipientGets, arrival,
  errors, isSubmitting, serverError,
  setRecipientName, setIban, setAmount, setFromCurrency, setToCurrency,
  swapCurrencies, handleSubmit,
  onBlurRecipientName, onBlurIban,
}: TransferFormProps) {
  const amountNum = parseFloat(amount) || 0
  const ctaLabel = amountNum > 0 ? `Send ${formatCurrency(amountNum, fromCurrency)}` : 'Send money'

  return (
    <section>
      <header className="mb-8 fade-up">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">New transfer</p>
        <h1 className="mt-2 text-[40px] leading-[1.02] font-semibold tracking-[-0.028em] text-ink">
          Send money<span className="text-accent">.</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-text max-w-[36ch]">
          Mid-market rate, no hidden fees. Estimated arrival{' '}
          <span className="font-medium text-ink">{arrival}</span>.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <div className="card fade-up-1 mb-4">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <label htmlFor="amount-input" className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                You send
              </label>
              <button type="button" aria-label="Swap currencies" onClick={swapCurrencies} className="swap-btn">
                {swapIcon}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-mono text-[22px] text-subtle w-5 shrink-0 tabular-nums">
                {currencyMeta[fromCurrency].symbol}
              </span>
              <input
                id="amount-input"
                data-testid="amount-input"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="amount-input"
                aria-invalid={!!errors.amount}
              />
              <select
                id="from-currency"
                data-testid="from-currency"
                aria-label="From currency"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as Currency)}
                className="ccy shrink-0"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{currencyMeta[c].flag}  {c}</option>
                ))}
              </select>
            </div>
            {errors.amount && (
              <p data-testid="field-error" className="mt-2 text-[12px] text-negative">{errors.amount}</p>
            )}
          </div>

          <div className="grid grid-cols-[1fr_1fr_1fr] divide-x divide-border border-y border-border bg-sunken text-[12px]">
            <Stat label="Fee" value={formatCurrency(fee, fromCurrency)} mono />
            <Stat label="Rate" value={`${rate.toFixed(4)}`} mono />
            <Stat label="Arrives" value={arrival} />
          </div>

          <div className="px-5 pt-4 pb-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              Recipient gets
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-mono text-[22px] text-subtle w-5 shrink-0 tabular-nums">
                {currencyMeta[toCurrency].symbol}
              </span>
              <div className="amount-input text-accent">
                {formatNumber(recipientGets, toCurrency)}
              </div>
              <select
                id="to-currency"
                data-testid="to-currency"
                aria-label="To currency"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as Currency)}
                className="ccy shrink-0"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{currencyMeta[c].flag}  {c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card fade-up-2 mb-5 p-5 space-y-4">
          <div>
            <label htmlFor="recipient-name" className="block text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              Recipient name
            </label>
            <input
              id="recipient-name"
              data-testid="recipient-name"
              type="text"
              autoComplete="name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              onBlur={onBlurRecipientName}
              placeholder="e.g. Margaux Bellefontaine"
              className={`field mt-1.5${errors.recipientName ? ' field-invalid' : ''}`}
              aria-invalid={!!errors.recipientName}
            />
            {errors.recipientName && (
              <p data-testid="field-error" className="mt-1.5 text-[12px] text-negative">{errors.recipientName}</p>
            )}
          </div>

          <div>
            <label htmlFor="iban-input" className="block text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              IBAN
            </label>
            <input
              id="iban-input"
              data-testid="iban-input"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              onBlur={onBlurIban}
              placeholder="DE89 3704 0044 0532 0130 00"
              className={`field mt-1.5 font-mono tracking-[0.02em]${errors.iban ? ' field-invalid' : ''}`}
              aria-invalid={!!errors.iban}
            />
            {errors.iban && (
              <p data-testid="field-error" className="mt-1.5 text-[12px] text-negative">{errors.iban}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          data-testid="send-button"
          disabled={isSubmitting}
          className="cta fade-up-3"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Sending…</span>
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <span>{ctaLabel}</span>
              {submitArrow}
            </span>
          )}
        </button>

        <div className="fade-up-4 mt-4 flex items-start gap-2.5 text-[12px] text-muted leading-relaxed">
          {lockIcon}
          <span>
            256-bit encrypted. Safeguarded with tier-1 partner banks. Arrives in 1–2 business days.
          </span>
        </div>
      </form>

      {serverError && (
        <div
          data-testid="error-message"
          role="alert"
          className="fade-up mt-5 rounded-[10px] border px-4 py-3 text-[13px]"
          style={{
            borderColor: 'var(--color-negative-edge)',
            background: 'var(--color-negative-tint)',
            color: 'var(--color-negative)',
          }}
        >
          <div className="flex items-start gap-2.5">
            {errorIcon}
            <span>{serverError}</span>
          </div>
        </div>
      )}
    </section>
  )
}
