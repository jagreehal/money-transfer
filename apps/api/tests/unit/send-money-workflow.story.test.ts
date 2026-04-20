import { Effect, Exit } from "effect"
import { story } from "executable-stories-vitest"
import { describe, expect, it } from "vitest"
import { convertCurrency } from "../../src/transfer/convert-currency"
import { executeTransfer } from "../../src/transfer/execute-transfer"
import { fetchRate } from "../../src/transfer/fetch-rate"
import { sendConfirmation } from "../../src/transfer/send-confirmation"
import { createSendMoneyWorkflow, type SendMoneyDeps } from "../../src/transfer/send-money-workflow"
import {
  InsufficientFundsError,
  type RateMatrix,
  RateUnavailableError,
  ValidationError
} from "../../src/transfer/types"
import { validateTransfer } from "../../src/transfer/validate-transfer"

const rateMatrix: RateMatrix = {
  GBP: { EUR: 1.17, USD: 1.27 },
  EUR: { GBP: 0.86, USD: 1.09 },
  USD: { GBP: 0.79, EUR: 0.92 }
}

const happyDeps: SendMoneyDeps = {
  validateTransfer,
  fetchRate: (args) => fetchRate(args, { getRates: () => Effect.succeed(rateMatrix) }),
  convertCurrency,
  getBalance: () => Effect.succeed(10000),
  executeTransfer: (args) => executeTransfer(args, { postTransfer: () => Effect.succeed({ transferId: "TXN-001" }) }),
  sendConfirmation: (args) => sendConfirmation(args, { notify: () => Effect.void })
}

// Railway diagram — matches the 6 named steps in send-money-workflow.ts
const TRANSFER_RAILWAY = `graph LR
  Start([Start]) --> validate
  validate --> fetchRate
  fetchRate --> getBalance
  getBalance --> convert
  convert --> executeTransfer
  executeTransfer --> confirm
  confirm --> End([End])
  validate -- ValidationError --> EV([Exit])
  fetchRate -- RateUnavailableError --> ER([Exit])
  convert -- InsufficientFundsError --> EI([Exit])
  executeTransfer -- TransferRejected/ProviderUnavailable --> ET([Exit])
  confirm -- ConfirmationFailedError --> EC([Exit])`

describe("Send Money Workflow", () => {
  it("workflow overview", ({ task }) => {
    story.init(task)
    story.section({ title: "Money Transfer Workflow", markdown: "End-to-end transfer steps and error branches." })
    story.mermaid({ title: "Transfer Railway", code: TRANSFER_RAILWAY })
    story.json({
      label: "Error Summary",
      value: {
        steps: ["validate", "fetchRate", "getBalance", "convert", "executeTransfer", "confirm"],
        errorsByStep: {
          validate: ["ValidationError"],
          fetchRate: ["RateUnavailableError"],
          convert: ["InsufficientFundsError"],
          executeTransfer: ["TransferRejectedError", "ProviderUnavailableError"],
          confirm: ["ConfirmationFailedError"]
        }
      }
    })
  })

  it("happy path: send £100 GBP → EUR", async ({ task }) => {
    story.init(task)
    story.tag("workflow")
    story.given("a valid transfer request for £100 GBP to EUR with rate 1.17 and balance £10000")

    const runSendMoney = createSendMoneyWorkflow(happyDeps)

    story.when("the workflow runs end-to-end")
    const result = await Effect.runPromise(
      runSendMoney({ recipientIban: "DE89370400440532013000", amount: 100, fromCurrency: "GBP", toCurrency: "EUR" })
    )

    story.then("the transfer completes with €117.00")
    expect(result.transferId).toBe("TXN-001")
    expect(result.convertedAmount).toBe(117)
    expect(result.rate).toBe(1.17)
    story.json({ label: "Transfer Result", value: result })
  })

  it("exits early on validation error", async ({ task }) => {
    story.init(task)
    story.tag("workflow")
    story.given("an IBAN that is too short")

    const runSendMoney = createSendMoneyWorkflow(happyDeps)

    story.when("the workflow runs")
    const exit = await Effect.runPromiseExit(
      runSendMoney({ recipientIban: "bad", amount: 100, fromCurrency: "GBP", toCurrency: "EUR" })
    )

    story.then("it exits at the validate step with ValidationError")
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      expect(exit.cause.error).toBeInstanceOf(ValidationError)
    }
  })

  it("exits early on rate unavailable", async ({ task }) => {
    story.init(task)
    story.tag("workflow")
    story.given("the rates API is down")

    const runSendMoney = createSendMoneyWorkflow({
      ...happyDeps,
      fetchRate: () => Effect.fail(new RateUnavailableError({ reason: "Rates API down" }))
    })

    story.when("the workflow runs")
    const exit = await Effect.runPromiseExit(
      runSendMoney({ recipientIban: "DE89370400440532013000", amount: 100, fromCurrency: "GBP", toCurrency: "EUR" })
    )

    story.then("it exits at the fetchRate step with RateUnavailableError")
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      expect(exit.cause.error).toBeInstanceOf(RateUnavailableError)
    }
  })

  it("exits early on insufficient funds", async ({ task }) => {
    story.init(task)
    story.tag("workflow")
    story.given("the user has £50 but wants to send £100")

    const runSendMoney = createSendMoneyWorkflow({
      ...happyDeps,
      getBalance: () => Effect.succeed(50)
    })

    story.when("the workflow runs")
    const exit = await Effect.runPromiseExit(
      runSendMoney({ recipientIban: "DE89370400440532013000", amount: 100, fromCurrency: "GBP", toCurrency: "EUR" })
    )

    story.then("it exits at the convert step with InsufficientFundsError")
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      const error = exit.cause.error as InsufficientFundsError
      expect(error).toBeInstanceOf(InsufficientFundsError)
      expect(error.required).toBe(100)
      expect(error.available).toBe(50)
    }
  })
})
