import { test, expect } from "@playwright/test"
import { story } from "executable-stories-playwright"

test.describe("Dark mode foundation (AI-5)", () => {
  test("system dark preference paints dark with no light flash", async ({
    browser,
  }, testInfo) => {
    story.init(testInfo)

    story.given("a visitor whose OS is set to dark mode and has no stored override")
    const ctx = await browser.newContext({ colorScheme: "dark" })
    const page = await ctx.newPage()

    story.when("they hard-reload the Atlas Transfer home page")
    await page.goto("/")
    await page.getByTestId("send-button").waitFor({ state: "visible" })

    story.then("the <html> element has the dark class set before first paint")
    await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/)

    story.then("the canvas background resolves to the dark token")
    const canvas = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--color-canvas").trim(),
    )
    expect(canvas).not.toBe("")
    // Dark token has low lightness (oklch(~6% ...))
    expect(canvas).toMatch(/oklch\(\s*(?:[0-9]|1[0-9])(?:\.\d+)?%/)

    story.then("the theme-color meta tag matches the dark canvas")
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#0c0d13",
    )

    await page.screenshot({ path: "screenshots/dark-mode-system.png" })
    story.screenshot({
      path: "../screenshots/dark-mode-system.png",
      alt: "Home page rendered in dark mode via system preference",
    })

    await ctx.close()
  })

  test("localStorage override beats system preference", async ({ browser }, testInfo) => {
    story.init(testInfo)

    story.given("a visitor whose OS is dark but who has chosen light previously")
    const ctx = await browser.newContext({ colorScheme: "dark" })
    const page = await ctx.newPage()
    await page.addInitScript(() => {
      localStorage.setItem("theme", "light")
    })

    story.when("they reload the page")
    await page.goto("/")
    await page.getByTestId("send-button").waitFor({ state: "visible" })

    story.then("the <html> element uses the light class, not dark")
    await expect(page.locator("html")).toHaveClass(/(^|\s)light(\s|$)/)
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)dark(\s|$)/)

    story.then("the canvas token resolves to the light palette")
    const canvas = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--color-canvas").trim(),
    )
    // Light canvas is oklch(98.6% ...)
    expect(canvas).toMatch(/oklch\(\s*9[5-9](?:\.\d+)?%/)

    story.then("the theme-color meta tag matches the light canvas")
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#f8f8fa",
    )

    await ctx.close()
  })

  test("toggling the dark class swaps palette tokens live", async ({ page }, testInfo) => {
    story.init(testInfo)

    story.given("a visitor on the home page in light mode")
    await page.goto("/")
    await page.getByTestId("send-button").waitFor({ state: "visible" })

    const readCanvas = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--color-canvas")
          .trim(),
      )

    const lightCanvas = await readCanvas()
    expect(lightCanvas).toMatch(/oklch\(\s*9[5-9](?:\.\d+)?%/)

    story.when("a developer toggles <html class=\"dark\"> in devtools")
    await page.evaluate(() => {
      document.documentElement.classList.remove("light")
      document.documentElement.classList.add("dark")
    })

    story.then("every token overridden by .dark takes effect")
    const darkCanvas = await readCanvas()
    expect(darkCanvas).not.toBe(lightCanvas)
    expect(darkCanvas).toMatch(/oklch\(\s*(?:[0-9]|1[0-9])(?:\.\d+)?%/)

    // Ink (text) should flip from dark to light
    const ink = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--color-ink").trim(),
    )
    expect(ink).toMatch(/oklch\(\s*[89][0-9](?:\.\d+)?%/)
  })

  test("fires one theme.applied PostHog event per page load", async ({ browser }, testInfo) => {
    story.init(testInfo)

    story.given(
      "analytics tooling captures one event when the resolved theme is applied",
    )
    const ctx = await browser.newContext({ colorScheme: "dark" })
    const page = await ctx.newPage()

    story.when("the page loads with no stored override")
    await page.goto("/")
    await page.getByTestId("send-button").waitFor({ state: "visible" })

    story.then("window.__themeApplied reflects the resolved theme and its source")
    const themeApplied = await page.evaluate(
      () => (window as unknown as { __themeApplied?: unknown }).__themeApplied,
    )
    expect(themeApplied).toEqual({ theme: "dark", source: "system" })

    story.when("the visitor stores an override and reloads")
    await page.evaluate(() => localStorage.setItem("theme", "light"))
    await page.reload()
    await page.getByTestId("send-button").waitFor({ state: "visible" })

    story.then("the source is reported as override")
    const afterOverride = await page.evaluate(
      () => (window as unknown as { __themeApplied?: unknown }).__themeApplied,
    )
    expect(afterOverride).toEqual({ theme: "light", source: "override" })

    await ctx.close()
  })
})
