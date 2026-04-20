# Money Transfer E2E Stories

## dark-mode.story.spec.ts

### Dark mode foundation (AI-5)

### ✅ system dark preference paints dark with no light flash

- **Given** a visitor whose OS is set to dark mode and has no stored override
- **When** they hard-reload the Atlas Transfer home page
- **Then** the <html> element has the dark class set before first paint
- **And** the canvas background resolves to the dark token
- **And** the theme-color meta tag matches the dark canvas
    ![Home page rendered in dark mode via system preference](../screenshots/dark-mode-system.png)

### ✅ localStorage override beats system preference

- **Given** a visitor whose OS is dark but who has chosen light previously
- **When** they reload the page
- **Then** the <html> element uses the light class, not dark
- **And** the canvas token resolves to the light palette
- **And** the theme-color meta tag matches the light canvas

### ✅ toggling the dark class swaps palette tokens live

- **Given** a visitor on the home page in light mode
- **When** a developer toggles <html class="dark"> in devtools
- **Then** every token overridden by .dark takes effect

### ✅ fires one theme.applied PostHog event per page load

- **Given** analytics tooling captures one event when the resolved theme is applied
- **When** the page loads with no stored override
- **Then** window.__themeApplied reflects the resolved theme and its source
- **And** the visitor stores an override and reloads
- **And** the source is reported as override

## send-money.story.spec.ts

### Money Transfer

### ✅ sends 100 GBP to EUR

- **Given** a user navigates to the money transfer page
- **When** they fill in the transfer form and click Send
- **Then** they see the transfer result with converted amount
    ![100 GBP sent and converted to EUR](../screenshots/send-gbp-eur.png)

### ✅ sends 200 USD to GBP

- **Given** a user navigates to the money transfer page
- **When** they send 200 USD to GBP
- **Then** they see the transfer result with converted amount in GBP
    ![200 USD sent and converted to GBP](../screenshots/send-usd-gbp.png)

### ✅ shows validation errors when form is empty

- **Given** a user navigates to the money transfer page
- **When** they click Send without filling in any fields
- **Then** validation errors appear for all required fields
- **And** no server request is made and no transfer result is shown
    ![Validation errors shown for empty form fields](../screenshots/validation-errors.png)

### ✅ shows an error for an invalid IBAN

- **Given** a user navigates to the money transfer page
- **When** they enter a valid name but an IBAN that is too short and click Send
- **Then** a validation error is shown for the IBAN field

## trace-verification.story.spec.ts

### ✅ server function response is traced

- **Given** the TanStack Start app is running with autotel-tanstack
- **When** we navigate to the page and send a transfer
- **Then** the transfer completes successfully