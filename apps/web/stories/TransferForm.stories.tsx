import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { TransferForm } from '../app/transfer/TransferForm'

const baseArgs = {
  amount: '1000',
  fromCurrency: 'GBP' as const,
  toCurrency: 'EUR' as const,
  recipientName: '',
  iban: '',
  fee: 3.50,
  rate: 1.1860,
  recipientGets: 1182.86,
  arrival: 'Mon 21 Apr',
  errors: {},
  touched: {},
  isSubmitting: false,
  serverError: null,
  setAmount: fn(),
  setFromCurrency: fn(),
  setToCurrency: fn(),
  setRecipientName: fn(),
  setIban: fn(),
  swapCurrencies: fn(),
  handleSubmit: fn(),
  onBlurRecipientName: fn(),
  onBlurIban: fn(),
}

const meta = {
  title: 'Transfer/TransferForm',
  component: TransferForm,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: baseArgs,
} satisfies Meta<typeof TransferForm>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {}

export const Submitting: Story = {
  args: {
    isSubmitting: true,
    recipientName: 'Margaux Bellefontaine',
    iban: 'DE89 3704 0044 0532 0130 00',
  },
  play: async ({ canvas }) => {
    const button = canvas.getByTestId('send-button')
    await expect(button).toBeDisabled()
    await expect(canvas.getByText('Sending…')).toBeInTheDocument()
  },
}

export const FieldErrors: Story = {
  args: {
    amount: '0',
    errors: {
      recipientName: 'Recipient name is required',
      iban: 'IBAN is required',
      amount: 'Enter a valid amount greater than 0',
    },
    touched: { recipientName: true, iban: true, amount: true },
  },
  play: async ({ canvas }) => {
    const errors = canvas.getAllByTestId('field-error')
    await expect(errors).toHaveLength(3)
    await expect(canvas.getByText('Recipient name is required')).toBeInTheDocument()
    await expect(canvas.getByText('IBAN is required')).toBeInTheDocument()
    await expect(canvas.getByText('Enter a valid amount greater than 0')).toBeInTheDocument()
  },
}

export const ServerError: Story = {
  args: {
    recipientName: 'Margaux Bellefontaine',
    iban: 'DE89 3704 0044 0532 0130 00',
    serverError: 'Transfer failed. Please check your inputs and try again.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('error-message')).toBeInTheDocument()
    await expect(
      canvas.getByText('Transfer failed. Please check your inputs and try again.')
    ).toBeInTheDocument()
  },
}

export const SwapCurrencies: Story = {
  play: async ({ canvas, args }) => {
    const swapBtn = canvas.getByRole('button', { name: /Swap currencies/i })
    await userEvent.click(swapBtn)
    await expect(args.swapCurrencies).toHaveBeenCalledOnce()
  },
}
