import { expect, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

export async function expectNoA11yViolations(
  page: Page,
  testInfo: TestInfo,
  scope = "page",
) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      .fade-up,
      .fade-up-1,
      .fade-up-2,
      .fade-up-3,
      .fade-up-4,
      .amount-reveal {
        opacity: 1 !important;
      }
    `,
  });
  const scanResults = await new AxeBuilder({ page })
    .withTags(wcagTags)
    .analyze();

  await testInfo.attach(`a11y-scan-${scope}`, {
    body: JSON.stringify(scanResults.violations, null, 2),
    contentType: "application/json",
  });

  expect(
    scanResults.violations,
    `Expected no WCAG A/AA axe violations in ${scope}`,
  ).toEqual([]);
}
