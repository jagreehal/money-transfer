import { test, expect } from "@playwright/test"
import { story } from "executable-stories-playwright"
import { expectNoA11yViolations } from "./a11y"
import { setInputValue, setIbanValue } from "./helpers"

test.describe("Money Transfer", () => {
  test("sends 100 GBP to EUR", async ({ page }, testInfo) => {
    story.init(testInfo)

    story.given("a user navigates to the money transfer page")
    await page.goto("/")
    await page.getByTestId("send-button").waitFor({ state: "visible" })

    story.when("they fill in the transfer form and click Send")
    await setInputValue(page, "recipient-name", "John Doe")
    await setIbanValue(page, "DE89370400440532013000")
    await setInputValue(page, "amount-input", "100")
    await page.getByTestId("from-currency").selectOption("GBP")
    await page.getByTestId("to-currency").selectOption("EUR")
    await page.getByTestId("send-button").click()

    story.then("they see the transfer result with converted amount")
    await expect(
      page
        .getByTestId("transfer-result")
        .or(page.getByTestId("error-message")),
    ).toBeVisible({ timeout: 10_000 })
    const errorEl = page.getByTestId("error-message")
    if (await errorEl.isVisible()) {
      const errorText = await errorEl.textContent()
      throw new Error(`Transfer failed with error: ${errorText}`)
    }
    await expect(page.getByTestId("converted-amount")).toContainText("EUR")
    await expectNoA11yViolations(page, testInfo, "send-gbp-eur")

    await page.screenshot({ path: "screenshots/send-gbp-eur.png" })
    story.screenshot({
      path: "../screenshots/send-gbp-eur.png",
      alt: "100 GBP sent and converted to EUR",
    })
  })

  test("sends 200 USD to GBP", async ({ page }, testInfo) => {
    story.init(testInfo)

    story.given("a user navigates to the money transfer page")
    await page.goto("/")
    await page.getByTestId("send-button").waitFor({ state: "visible" })

    story.when("they send 200 USD to GBP")
    await setInputValue(page, "recipient-name", "Jane Smith")
    await setIbanValue(page, "GB29NWBK60161331926819")
    await setInputValue(page, "amount-input", "200")
    await page.getByTestId("from-currency").selectOption("USD")
    await page.getByTestId("to-currency").selectOption("GBP")
    await page.getByTestId("send-button").click()

    story.then("they see the transfer result with converted amount in GBP")
    await expect(
      page
        .getByTestId("transfer-result")
        .or(page.getByTestId("error-message")),
    ).toBeVisible({ timeout: 10_000 })
    const usdError = page.getByTestId("error-message")
    if (await usdError.isVisible()) {
      throw new Error(
        `Transfer failed with error: ${await usdError.textContent()}`,
      )
    }
    await expect(page.getByTestId("converted-amount")).toContainText("GBP")
    await expectNoA11yViolations(page, testInfo, "send-usd-gbp")

    await page.screenshot({ path: "screenshots/send-usd-gbp.png" })
    story.screenshot({
      path: "../screenshots/send-usd-gbp.png",
      alt: "200 USD sent and converted to GBP",
    })
  })

  test("shows validation errors when form is empty", async ({ page }, testInfo) => {
    story.init(testInfo)

    story.given("a user navigates to the money transfer page")
    await page.goto("/")
    await page.getByTestId("send-button").waitFor({ state: "visible" })

    story.when("they click Send without filling in any fields")
    await setInputValue(page, "amount-input", "")
    await page.getByTestId("send-button").click()

    story.then("validation errors appear for all required fields")
    const errors = page.getByTestId("field-error")
    await expect(errors.first()).toBeVisible({ timeout: 5_000 })

    const errorTexts = await errors.allTextContents()
    expect(errorTexts.some((t) => t.includes("Recipient name is required"))).toBe(true)
    expect(errorTexts.some((t) => t.includes("IBAN is required"))).toBe(true)
    expect(errorTexts.some((t) => t.includes("Enter a valid amount"))).toBe(true)

    story.then("no server request is made and no transfer result is shown")
    await expect(page.getByTestId("transfer-result")).not.toBeVisible()
    await expect(page.getByTestId("error-message")).not.toBeVisible()
    await expectNoA11yViolations(page, testInfo, "empty-form-validation")

    await page.screenshot({ path: "screenshots/validation-errors.png" })
    story.screenshot({
      path: "../screenshots/validation-errors.png",
      alt: "Validation errors shown for empty form fields",
    })
  })

  test("shows an error for an invalid IBAN", async ({ page }, testInfo) => {
    story.init(testInfo)

    story.given("a user navigates to the money transfer page")
    await page.goto("/")
    await page.getByTestId("send-button").waitFor({ state: "visible" })

    story.when("they enter a valid name but an IBAN that is too short and click Send")
    await setInputValue(page, "recipient-name", "Test User")
    await setIbanValue(page, "not-an-iban")
    await setInputValue(page, "amount-input", "50")
    await page.getByTestId("send-button").click()

    story.then("a validation error is shown for the IBAN field")
    const errors = page.getByTestId("field-error")
    await expect(errors.first()).toBeVisible({ timeout: 5_000 })
    const errorTexts = await errors.allTextContents()
    expect(errorTexts.some((t) => t.includes("IBAN must be at least 15 characters"))).toBe(true)
    await expectNoA11yViolations(page, testInfo, "invalid-iban")
  })
})
