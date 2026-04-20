import { Effect } from "effect"
import { story } from "executable-stories-vitest"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { convertCurrency } from "../../src/transfer/convert-currency"
import { executeTransfer } from "../../src/transfer/execute-transfer"
import { fetchRatesFromApi, postTransferToProvider, sendNotification } from "../../src/transfer/external-client"
import { fetchRate } from "../../src/transfer/fetch-rate"
import { sendConfirmation } from "../../src/transfer/send-confirmation"
import { createSendMoneyWorkflow } from "../../src/transfer/send-money-workflow"
import { validateTransfer } from "../../src/transfer/validate-transfer"

const RATES_API_BASE = "http://localhost:3000/api"
const mockRates: Record<string, Record<string, number>> = {
  USD: { USD: 1, GBP: 0.79, EUR: 0.92 },
  GBP: { GBP: 1, USD: 1.27, EUR: 1.17 },
  EUR: { EUR: 1, USD: 1.09, GBP: 0.86 }
}

const server = setupServer(
  http.get(`${RATES_API_BASE}/rates`, () => HttpResponse.json(mockRates)),
  http.post(`${RATES_API_BASE}/transfer`, () => HttpResponse.json({ transferId: "TXN-MSW-001" }))
)

beforeAll(() => {
  process.env.RATES_API_BASE_URL = RATES_API_BASE
  server.listen({ onUnhandledRequest: "error" })
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const runSendMoney = createSendMoneyWorkflow({
  validateTransfer,
  fetchRate: (args) => fetchRate(args, { getRates: fetchRatesFromApi }),
  convertCurrency,
  getBalance: () => Effect.succeed(10000),
  executeTransfer: (args) => executeTransfer(args, { postTransfer: postTransferToProvider }),
  sendConfirmation: (args) => sendConfirmation(args, { notify: sendNotification })
})

describe("Send Money Workflow (MSW)", () => {
  it("sendMoney uses rates from mocked api-rates", async ({ task }) => {
    story.init(task)
    story.given("a valid transfer request for £100 GBP to EUR with MSW mocking the rates API")
    story.when("the workflow runs end-to-end")
    const result = await Effect.runPromise(
      runSendMoney({ recipientIban: "DE89370400440532013000", amount: 100, fromCurrency: "GBP", toCurrency: "EUR" })
    )
    story.then("the transfer completes with €117.00 using the mocked rate 1.17")
    expect(result.convertedAmount).toBe(117)
    story.json({ label: "Transfer Result", value: result })
  })
})
