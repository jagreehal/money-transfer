import { getCollector } from "./setup-autotel-span"

import { span } from "autotel"
import { Effect } from "effect"
import { story } from "executable-stories-vitest"
import { describe, expect, it } from "vitest"
import { AutotelEffectLive } from "../../src/effect-layer"
import { convertCurrency } from "../../src/transfer/convert-currency"
import { executeTransfer } from "../../src/transfer/execute-transfer"
import { fetchRatesFromApi, postTransferToProvider, sendNotification } from "../../src/transfer/external-client"
import { fetchRate } from "../../src/transfer/fetch-rate"
import { sendConfirmation } from "../../src/transfer/send-confirmation"
import { createSendMoneyWorkflow } from "../../src/transfer/send-money-workflow"
import { validateTransfer } from "../../src/transfer/validate-transfer"

const JAEGER_TRACE_URL = "http://localhost:16686/trace/{traceId}"

const runSendMoney = createSendMoneyWorkflow({
  validateTransfer,
  fetchRate: (args) => fetchRate(args, { getRates: fetchRatesFromApi }),
  convertCurrency,
  getBalance: () => Effect.succeed(10000),
  executeTransfer: (args) => executeTransfer(args, { postTransfer: postTransferToProvider }),
  sendConfirmation: (args) => sendConfirmation(args, { notify: sendNotification })
})

describe("Send Money Workflow (autotel spans)", () => {
  it("produces the full span tree for a successful transfer", async ({ task }) => {
    story.init(task, { traceUrlTemplate: JAEGER_TRACE_URL })

    story.given("autotel uses TestSpanCollector for trace capture")
    story.when("the sendMoney workflow runs for 100 GBP to EUR")

    const { traceId, spanId } = await span(
      { name: "POST /api/transfer" },
      async (s) => {
        await Effect.runPromise(
          runSendMoney({ recipientIban: "DE89370400440532013000", amount: 100, fromCurrency: "GBP", toCurrency: "EUR" })
            .pipe(Effect.provide(AutotelEffectLive))
        )
        return {
          traceId: s.spanContext().traceId,
          spanId: s.spanContext().spanId
        }
      }
    )

    const collector = getCollector()
    const serializedSpans = collector.drainTrace(traceId, spanId)

    story.then("the full workflow span tree is recorded")
    const spanNames = serializedSpans.map((s) => s.name)
    expect(spanNames).toContain("sendMoney")
    expect(spanNames).toContain("validate")
    expect(spanNames).toContain("fetchRate")
    expect(spanNames).toContain("getBalance")
    expect(spanNames).toContain("convert")
    expect(spanNames).toContain("executeTransfer")
    expect(spanNames).toContain("confirm")

    story.note(`Total spans: ${serializedSpans.length}`)
    story.note(`Span names: ${spanNames.join(", ")}`)

    story.attachSpans(serializedSpans)
  })

  it("records validation attributes on the validate span", async ({ task }) => {
    story.init(task, { traceUrlTemplate: JAEGER_TRACE_URL })

    story.given("autotel uses TestSpanCollector for trace capture")
    story.when("a 250 EUR to USD transfer is validated")

    const { traceId, spanId } = await span(
      { name: "POST /api/transfer" },
      async (s) => {
        await Effect.runPromise(
          runSendMoney({ recipientIban: "GB29NWBK60161331926819", amount: 250, fromCurrency: "EUR", toCurrency: "USD" })
            .pipe(Effect.provide(AutotelEffectLive))
        )
        return {
          traceId: s.spanContext().traceId,
          spanId: s.spanContext().spanId
        }
      }
    )

    const collector = getCollector()
    const serializedSpans = collector.drainTrace(traceId, spanId)

    story.then("the validate span contains transfer attributes")
    const validateSpan = serializedSpans.find((s) => s.name === "validate")
    expect(validateSpan).toBeDefined()
    expect(validateSpan!.attributes["transfer.amount"]).toBe(250)
    expect(validateSpan!.attributes["transfer.from_currency"]).toBe("EUR")
    expect(validateSpan!.attributes["transfer.to_currency"]).toBe("USD")
    expect(validateSpan!.attributes["validation.status"]).toBe("passed")

    story.note(`Validate span attributes: ${JSON.stringify(validateSpan!.attributes, null, 2)}`)

    story.attachSpans(serializedSpans)
  })
})
