import { Effect, Exit } from "effect"
import { story } from "executable-stories-vitest"
import { describe, expect, it } from "vitest"
import { convertCurrency } from "../../src/transfer/convert-currency"
import { InsufficientFundsError } from "../../src/transfer/types"

describe("Convert Currency", () => {
  it("converts 100 GBP to EUR at rate 1.17", async ({ task }) => {
    story.init(task)
    story.tag("conversion")
    story.given("a balance of £500 and an exchange rate of 1.17")
    story.when("100 GBP is converted to EUR")
    const result = await Effect.runPromise(
      convertCurrency({ amount: 100, rate: 1.17, fromCurrency: "GBP", toCurrency: "EUR", balance: 500 })
    )
    story.then("it returns €117.00")
    expect(result.convertedAmount).toBe(117)
    expect(result.rate).toBe(1.17)
  })

  it("returns InsufficientFundsError when balance too low", async ({ task }) => {
    story.init(task)
    story.tag("conversion")
    story.given("a balance of £500 but wanting to send £1000")
    story.when("1000 GBP is converted to EUR")
    const exit = await Effect.runPromiseExit(
      convertCurrency({ amount: 1000, rate: 1.17, fromCurrency: "GBP", toCurrency: "EUR", balance: 500 })
    )
    story.then("it returns InsufficientFundsError with required and available amounts")
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      const error = exit.cause.error as InsufficientFundsError
      expect(error).toBeInstanceOf(InsufficientFundsError)
      expect(error.required).toBe(1000)
      expect(error.available).toBe(500)
    }
  })

  it("rounds to 2 decimal places", async ({ task }) => {
    story.init(task)
    story.tag("conversion")
    story.given("a balance of £500 and an exchange rate of 1.17")
    story.when("33 GBP is converted to EUR")
    const result = await Effect.runPromise(
      convertCurrency({ amount: 33, rate: 1.17, fromCurrency: "GBP", toCurrency: "EUR", balance: 500 })
    )
    story.then("the result is rounded to 38.61")
    expect(result.convertedAmount).toBe(38.61)
  })
})
