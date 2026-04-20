export default async function globalSetup() {
  // Warm up both web and API
  const web = await fetch("http://localhost:3002/").catch(() => null)
  if (!web?.ok) throw new Error(`Web warmup failed: ${web?.status}`)

  await fetch("http://localhost:8787/api/health").catch(() => {
    throw new Error("API not running on :8787 — start it with: pnpm dev:api")
  })
}
