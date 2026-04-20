import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { wrapModule } from 'autotel-cloudflare'
import { track } from 'autotel'
import { Effect } from 'effect'
import { AutotelEffectLive } from './effect-layer'
import { convertCurrency } from './transfer/convert-currency'
import { executeTransfer } from './transfer/execute-transfer'
import { fetchRatesFromApi, postTransferToProvider, sendNotification } from './transfer/external-client'
import { fetchRate } from './transfer/fetch-rate'
import { sendConfirmation } from './transfer/send-confirmation'
import { createSendMoneyWorkflow } from './transfer/send-money-workflow'
import { validateTransfer } from './transfer/validate-transfer'

type Env = {
  ENV: string
  POSTHOG_HOST: string
  OTEL_EXPORTER_OTLP_ENDPOINT: string
  ALLOWED_ORIGIN: string
}

const runSendMoney = createSendMoneyWorkflow({
  validateTransfer,
  fetchRate: (args) => fetchRate(args, { getRates: fetchRatesFromApi }),
  convertCurrency,
  getBalance: () => Effect.succeed(10000),
  executeTransfer: (args) => executeTransfer(args, { postTransfer: postTransferToProvider }),
  sendConfirmation: (args) => sendConfirmation(args, { notify: sendNotification })
})

const app = new Hono<{ Bindings: Env }>()

app.use('*', (c, next) => cors({ origin: c.env.ALLOWED_ORIGIN ?? 'http://localhost:3000', credentials: true })(c, next))

app.get('/api/health', (c) => c.json({ ok: true }))

app.post('/v1/traces', async (c) => {
  const body = await c.req.arrayBuffer()
  await fetch(`${c.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  return c.json({ ok: true })
})

app.post('/ingest/*', async (c) => {
  const path = c.req.path.replace('/ingest', '')
  const body = await c.req.arrayBuffer()
  const resp = await fetch(`${c.env.POSTHOG_HOST}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': c.req.header('content-type') || 'application/json' },
    body,
  })
  return new Response(resp.body, { status: resp.status, headers: resp.headers })
})

app.get('/ingest/decide*', async (c) => {
  const url = new URL(c.req.url)
  const resp = await fetch(`${c.env.POSTHOG_HOST}/decide${url.search}`)
  return new Response(resp.body, { status: resp.status, headers: resp.headers })
})

app.post('/api/transfer', async (c) => {
  const input = await c.req.json()

  track('transfer.initiated', {
    amount: input.amount,
    fromCurrency: input.fromCurrency,
    toCurrency: input.toCurrency,
  })

  const either = await Effect.runPromise(
    Effect.either(runSendMoney(input).pipe(Effect.provide(AutotelEffectLive)))
  )

  if (either._tag === 'Left') {
    const error = either.left
    track('transfer.failed', {
      errorType: error._tag,
      amount: input.amount,
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
    })
    return c.json({ error: error._tag, message: 'reason' in error ? error.reason : 'Transfer failed' }, 400)
  }

  const result = either.right
  track('transfer.completed', {
    transferId: result.transferId,
    amount: input.amount,
    convertedAmount: result.convertedAmount,
    exchangeRate: result.rate,
    fromCurrency: input.fromCurrency,
    toCurrency: input.toCurrency,
  })

  return c.json({
    transferId: result.transferId,
    convertedAmount: result.convertedAmount,
    rate: result.rate,
    from: input.fromCurrency,
    to: input.toCurrency,
    amount: input.amount
  })
})

export default wrapModule<Env>(
  (env) => ({
    service: { name: 'money-transfer-api' },
    exporter: { url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces` }
  }),
  {
    fetch: app.fetch
  }
)
