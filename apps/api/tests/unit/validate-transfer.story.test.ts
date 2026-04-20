import { Effect, Exit } from "effect"
import { story } from "executable-stories-vitest"
import { describe, expect, it } from "vitest"
import { ValidationError } from "../../src/transfer/types"
import { validateTransfer } from "../../src/transfer/validate-transfer"

describe("Validate Transfer", () => {
  it("accepts valid transfer input", async ({ task }) => {
    story.init(task)
    story.tag("validation")
    story.given("a user provides valid transfer details")
    story.when("the input is validated")
    const result = await Effect.runPromise(
      validateTransfer({ recipientIban: "DE89370400440532013000", amount: 100, fromCurrency: "GBP", toCurrency: "EUR" })
    )
    story.then("validation succeeds with validated transfer data")
    expect(result._validated).toBe(true)
  })

  it("rejects invalid IBAN", async ({ task }) => {
    story.init(task)
    story.tag("validation")
    story.given("a user provides an IBAN that is too short")
    story.when("the input is validated")
    const exit = await Effect.runPromiseExit(
      validateTransfer({ recipientIban: "bad", amount: 100, fromCurrency: "GBP", toCurrency: "EUR" })
    )
    story.then("validation fails with a ValidationError")
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      expect(exit.cause.error).toBeInstanceOf(ValidationError)
    }
  })

  it("rejects same source and target currency", async ({ task }) => {
    story.init(task)
    story.tag("validation")
    story.given("a user tries to transfer GBP to GBP")
    story.when("the input is validated")
    const exit = await Effect.runPromiseExit(
      validateTransfer({ recipientIban: "DE89370400440532013000", amount: 100, fromCurrency: "GBP", toCurrency: "GBP" })
    )
    story.then("validation fails — from and to currencies must differ")
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      expect(exit.cause.error).toBeInstanceOf(ValidationError)
    }
  })

  it("spec by example — validation rules", async ({ task }) => {
    story.init(task)
    story.tag("validation")
    const examples = [
      { iban: "bad", amount: 100, from: "GBP" as const, to: "EUR" as const, valid: false, reason: "IBAN too short" },
      {
        iban: "DE89370400440532013000",
        amount: -10,
        from: "GBP" as const,
        to: "EUR" as const,
        valid: false,
        reason: "Negative amount"
      },
      {
        iban: "DE89370400440532013000",
        amount: 100,
        from: "GBP" as const,
        to: "GBP" as const,
        valid: false,
        reason: "Same currency"
      },
      {
        iban: "DE89370400440532013000",
        amount: 100,
        from: "GBP" as const,
        to: "EUR" as const,
        valid: true,
        reason: "All valid"
      }
    ]
    story.table({
      label: "Validation Examples",
      columns: ["IBAN", "Amount", "From", "To", "Valid?", "Reason"],
      rows: examples.map((e) => [e.iban, String(e.amount), e.from, e.to, String(e.valid), e.reason])
    })
    for (const ex of examples) {
      const exit = await Effect.runPromiseExit(
        validateTransfer({ recipientIban: ex.iban, amount: ex.amount, fromCurrency: ex.from, toCurrency: ex.to })
      )
      expect(Exit.isSuccess(exit)).toBe(ex.valid)
    }
  })
})
