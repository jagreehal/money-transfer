import { Effect } from "effect"
import {
  ConfirmationFailedError,
  ProviderUnavailableError,
  type RateMatrix,
  RateUnavailableError,
  TransferRejectedError
} from "./types"

const rates: RateMatrix = {
  GBP: { EUR: 1.17, USD: 1.27 },
  EUR: { GBP: 0.86, USD: 1.09 },
  USD: { GBP: 0.79, EUR: 0.92 }
}

let counter = 0

export const fetchRatesFromApi = (): Effect.Effect<RateMatrix, RateUnavailableError> =>
  Effect.succeed(rates)

export const postTransferToProvider = (args: {
  recipientIban: string
  amount: number
  currency: string
}): Effect.Effect<{ transferId: string }, TransferRejectedError | ProviderUnavailableError> => {
  void args
  counter++
  return Effect.succeed({ transferId: `TXN-${String(counter).padStart(6, "0")}` })
}

export const sendNotification = (_args: {
  transferId: string
  amount: number
  currency: string
}): Effect.Effect<void, ConfirmationFailedError> => Effect.void
