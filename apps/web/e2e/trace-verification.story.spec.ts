import { test, expect } from "@playwright/test";
import { story } from "executable-stories-playwright";
import { setInputValue, setIbanValue } from "./helpers";

test("server function response is traced", async ({ page }, testInfo) => {
  story.init(testInfo);
  story.given("the TanStack Start app is running with autotel-tanstack");
  story.when("we navigate to the page and send a transfer");
  await page.goto("/");
  await page.getByTestId("send-button").waitFor({ state: "visible" });

  await setInputValue(page, "recipient-name", "Trace Test");
  await setIbanValue(page, "DE89370400440532013000");
  await setInputValue(page, "amount-input", "100");
  await page.getByTestId("from-currency").selectOption("GBP");
  await page.getByTestId("to-currency").selectOption("EUR");
  await page.getByTestId("send-button").click();

  story.then("the transfer completes successfully");
  await expect(
    page
      .getByTestId("transfer-result")
      .or(page.getByTestId("error-message")),
  ).toBeVisible({ timeout: 10_000 });
  const err = page.getByTestId("error-message");
  if (await err.isVisible()) {
    throw new Error(`Transfer failed: ${await err.textContent()}`);
  }
  await expect(page.getByTestId("converted-amount")).toContainText("EUR");
});
