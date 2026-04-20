if (import.meta.env.DEV) {
  import('react-grab')
}

import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { init } from 'autotel-web'
import posthog from 'posthog-js'
import MoneyTransfer from './MoneyTransfer'
import './styles.css'

init({
  service: 'money-transfer-web',
  debug: true,
  endpoint: '', // same-origin → Vite proxy → Hono /v1/traces → Jaeger
})

const posthogKey = import.meta.env.VITE_POSTHOG_KEY
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: '/ingest', // reverse proxy → bypasses ad blockers
    ui_host: 'https://eu.i.posthog.com',
  })
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  const time = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
  return <span className="tabular-nums">Live rates · {time}</span>
}

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-[480px] px-5 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 text-ink">
            <span
              aria-hidden
              className="grid h-[22px] w-[22px] place-items-center rounded-[5px] bg-ink text-surface"
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12, letterSpacing: '-0.02em' }}
            >
              A
            </span>
            <span className="font-semibold text-[14px] tracking-[-0.01em]">Atlas Transfer</span>
          </a>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span aria-hidden className="inline-block h-[6px] w-[6px] rounded-full bg-positive" style={{ boxShadow: '0 0 0 3px oklch(52% 0.12 152 / 0.18)' }} />
            <LiveClock />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[480px] px-5 pt-12 pb-16">
          <MoneyTransfer />
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[480px] px-5 py-5 flex items-center justify-between text-[11px] text-muted">
          <span>&copy; 2026 Atlas Transfer Ltd &middot; Regulated for demo purposes</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
