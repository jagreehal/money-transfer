export const currencies = ['GBP', 'EUR', 'USD'] as const
export type Currency = (typeof currencies)[number]

export interface TransferResult {
  convertedAmount: number
  rate: number
  transferId: string
}
