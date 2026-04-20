# Money Transfer E2E Stories

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