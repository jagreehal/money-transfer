import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { Receipt } from '../app/transfer/Receipt'

const meta = {
  title: 'Transfer/Receipt',
  component: Receipt,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    onReset: fn(),
  },
} satisfies Meta<typeof Receipt>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    result: { convertedAmount: 1186.00, rate: 1.186, transferId: 'TXN-DEMO-001' },
    amount: 1000,
    fromCurrency: 'GBP',
    toCurrency: 'EUR',
    recipientName: 'Margaux Bellefontaine',
    iban: 'DE89 3704 0044 0532 0130 00',
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByTestId('converted-amount')).toBeInTheDocument()
    await expect(canvas.getByText('Margaux Bellefontaine')).toBeInTheDocument()
    await expect(canvas.getByText('DE89 3704 0044 0532 0130 00')).toBeInTheDocument()
    const btn = canvas.getByRole('button', { name: /Send another/i })
    await userEvent.click(btn)
    await expect(args.onReset).toHaveBeenCalledOnce()
  },
}

export const LongValues: Story = {
  args: {
    result: {
      convertedAmount: 987654.32,
      rate: 0.98765,
      transferId: 'TXN-VERY-LONG-REFERENCE-ID-123456',
    },
    amount: 999999.99,
    fromCurrency: 'USD',
    toCurrency: 'GBP',
    recipientName: 'Bartholomew Winklehausen-Montgomery III',
    iban: 'GB29 NWBK 6016 1331 9268 19',
  },
}
