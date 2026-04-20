import { Effect, Exit } from "effect"
import { story } from "executable-stories-vitest"
import { describe, expect, it } from "vitest"
import { fetchRate, type FetchRateDeps } from "../../src/transfer/fetch-rate"
import { type RateMatrix, RateUnavailableError } from "../../src/transfer/types"

const rateMatrix: RateMatrix = {
  GBP: { EUR: 1.17, USD: 1.27 },
  EUR: { GBP: 0.86, USD: 1.09 },
  USD: { GBP: 0.79, EUR: 0.92 }
}

describe("Fetch Rate", () => {
  const successDeps: FetchRateDeps = {
    getRates: () => Effect.succeed(rateMatrix)
  }

  it("returns exchange rate for a supported pair", async ({ task }) => {
    story.init(task)
    story.tag("rates")
    story.given("a rates API is available with GBP/EUR at 1.17")
    story.when("the exchange rate for GBP to EUR is fetched")
    const result = await Effect.runPromise(fetchRate({ from: "GBP", to: "EUR" }, successDeps))
    story.then("it returns the correct rate of 1.17")
    expect(result).toEqual({ from: "GBP", to: "EUR", rate: 1.17 })
  })

  it("returns RateUnavailableError when rates API fails", async ({ task }) => {
    story.init(task)
    story.tag("rates")
    story.given("the rates API is down")
    const failDeps: FetchRateDeps = {
      getRates: () => Effect.fail(new RateUnavailableError({ reason: "Rates API down" }))
    }
    story.when("the exchange rate is fetched")
    const exit = await Effect.runPromiseExit(fetchRate({ from: "GBP", to: "EUR" }, failDeps))
    story.then("it returns a RateUnavailableError")
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      const error = exit.cause.error as RateUnavailableError
      expect(error).toBeInstanceOf(RateUnavailableError)
      expect(error.reason).toBe("Rates API down")
    }
  })

  it("returns RateUnavailableError when pair is missing from the matrix", async ({ task }) => {
    story.init(task)
    story.tag("rates")
    story.given("the rates matrix has no entry for GBP to USD")
    const sparseDeps: FetchRateDeps = {
      getRates: () => Effect.succeed({ GBP: { EUR: 1.17 }, EUR: {}, USD: {} } as RateMatrix)
    }
    story.when("the exchange rate for GBP to USD is fetched")
    const exit = await Effect.runPromiseExit(fetchRate({ from: "GBP", to: "USD" }, sparseDeps))
    story.then("it returns RateUnavailableError for the missing pair")
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      expect(exit.cause.error).toBeInstanceOf(RateUnavailableError)
    }
  })
})
