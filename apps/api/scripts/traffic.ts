const BASE = process.env.API_URL ?? "http://localhost:8787"
const ENDPOINT = `${BASE}/api/transfer`

type Currency = "GBP" | "EUR" | "USD"
const CURRENCIES: Currency[] = ["GBP", "EUR", "USD"]

function randomCurrencyPair(): { fromCurrency: Currency; toCurrency: Currency } {
  const from = CURRENCIES[Math.floor(Math.random() * 3)]!
  const others = CURRENCIES.filter((c) => c !== from)
  const to = others[Math.floor(Math.random() * 2)]!
  return { fromCurrency: from, toCurrency: to }
}

function randomAmount(): number {
  return Math.round((50 + Math.random() * 950) * 100) / 100
}

function cleanIban(i: number): string {
  return `GB${String(29 + (i % 10)).padStart(2, "0")}NWBK${String(i).padStart(16, "0")}`
}

function buggyIban(i: number): string {
  return `GB29b00mNWBK${String(i).padStart(12, "0")}`
}

async function sendTransfer(iban: string, label: string): Promise<void> {
  const { fromCurrency, toCurrency } = randomCurrencyPair()
  const amount = randomAmount()

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientIban: iban, amount, fromCurrency, toCurrency })
    })
    const status = res.ok ? "✅" : "❌"
    const body = await res.json().catch(() => ({}))
    console.log(`${status} [${label}] ${fromCurrency}→${toCurrency} ${amount} | IBAN: ${iban.slice(0, 14)}…`)
    if (!res.ok) console.log(`   error: ${(body as { error?: string }).error ?? res.status}`)
  } catch (e) {
    console.log(`💥 [${label}] fetch failed: ${e}`)
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log(`🚀 Sending traffic to ${ENDPOINT}\n`)

  const requests: Array<{ iban: string; label: string }> = []

  for (let i = 0; i < 35; i++) {
    requests.push({ iban: cleanIban(i), label: "clean" })
  }
  for (let i = 0; i < 15; i++) {
    requests.push({ iban: buggyIban(i), label: "b00m " })
  }

  // Fisher-Yates shuffle
  for (let i = requests.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[requests[i], requests[j]] = [requests[j]!, requests[i]!]
  }

  for (const req of requests) {
    await sendTransfer(req.iban, req.label)
    await delay(100 + Math.random() * 200)
  }

  console.log("\n✅ Traffic complete — check Jaeger at http://localhost:16686")
}

main()
