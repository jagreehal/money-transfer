import { expect, type Page } from "@playwright/test";

function setDomValue(el: Element, value: string) {
  const input = el as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

interface SetInputValueOptions {
  /**
   * Optional comparator for controlled inputs that transform their value on
   * change (e.g. IBAN auto-formatting with spaces). Defaults to strict equality.
   */
  matches?: (current: string, expected: string) => boolean;
}

/**
 * Controlled React inputs: a single DOM update can be overwritten when hydration
 * finishes. Re-apply until the field keeps the value (see Playwright `expect.poll`).
 */
export async function setInputValue(
  page: Page,
  testId: string,
  value: string,
  options: SetInputValueOptions = {},
) {
  const loc = page.getByTestId(testId);
  await loc.waitFor({ state: "visible" });

  const matches = options.matches ?? ((current, expected) => current === expected);

  await expect
    .poll(
      async () => {
        await loc.evaluate(setDomValue, value);
        const current = await loc.inputValue();
        return matches(current, value);
      },
      { timeout: 15_000, intervals: [50, 100, 200, 400] },
    )
    .toBe(true);
}

/**
 * Sets an IBAN value tolerant of the component's auto-formatting (uppercasing
 * and inserting spaces every 4 chars). Both sides are compared after stripping
 * whitespace and uppercasing, so "DE89370400440532013000" matches the rendered
 * "DE89 3704 0044 0532 0130 00".
 */
export async function setIbanValue(page: Page, value: string) {
  // The component strips all non-alphanumerics and uppercases, then inserts
  // a space every 4 chars. Normalise both sides back to the alphanumeric form
  // for comparison so e.g. "not-an-iban" matches the rendered "NOTA NIBAN".
  const normalize = (s: string) => s.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  await setInputValue(page, "iban-input", value, {
    matches: (current, expected) => normalize(current) === normalize(expected),
  });
}
