import { useTransferForm } from './transfer/useTransferForm'
import { TransferForm } from './transfer/TransferForm'
import { Receipt } from './transfer/Receipt'

export default function MoneyTransfer() {
  const form = useTransferForm()
  const { result, reset, ...formProps } = form

  if (result) {
    return (
      <Receipt
        result={result}
        amount={parseFloat(formProps.amount) || 0}
        fromCurrency={formProps.fromCurrency}
        toCurrency={formProps.toCurrency}
        recipientName={formProps.recipientName}
        iban={formProps.iban}
        onReset={reset}
      />
    )
  }

  return <TransferForm {...formProps} />
}
