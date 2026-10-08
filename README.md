# Calculators.si

An English-first calculator builder for business quotes, estimates and ROI. Describe a calculation, review and edit the resulting calculator, then share a public page or embed it on your website.

The public visual direction intentionally resembles a well-maintained 2008-2012 utility website rather than a generic AI startup landing page.

## Run locally

Use Node.js 24 (the tested version is pinned in `.nvmrc`). Dependencies are pinned in `package.json` and `package-lock.json`.

```sh
npm ci
npm run dev
```

Without an API key, generation uses local demo templates. Painting, cleaning and landscaping business templates are available directly in the builder; the original paint quantity, fuel, tiles and percentage demos remain available. No database or other service is needed.

For arbitrary AI-generated calculators, copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` there. Keep the file private and never commit it. In a cloud environment using proxy-backed secrets, use `CALCULATOR_OPENAI_API_KEY` instead and allow its HTTPS destination `api.openai.com`. The cloud binding takes precedence when both are set. `OPENAI_MODEL` defaults to `gpt-5.5`; the chosen model must support Responses API structured output.

The server uses the installed OpenAI SDK's `responses.create` with strict `text.format` JSON schema, including up to four short practical tips. Generated calculator text follows the language of the request; product controls are English. The resulting specification must pass the local whitelist math parser before it reaches the calculator. Model output is never executed as code. Incomplete responses and responses without structured text return an error.

## Editing, sharing and embedding

The editor changes title, description, input labels/defaults/units, output label/unit, assumptions and tips. It never edits input IDs or the formula. Defaults are checked against input limits and the existing formula before saving.

**Publish & share** creates a `/calculator?c=...` public link and an iframe snippet for `/embed?c=...`. Publishing encodes the validated specification in the URL; it does not create a database record. The public and embedded views contain the calculator and optional request form, without builder controls. Edited default inputs, assumptions and tips survive sharing. Subsequent customer input changes are not written back to the shared specification. Old `/?c=...` links remain readable; missing tips and lead settings receive safe defaults, and user-supplied verification badges are not trusted.

## Temporary request inboxes

The painting quote demo enables lead capture; other calculators can enable it in the editor. Publishing creates an inbox and a random private owner token. The public link contains only an inbox ID. The creator's browser keeps the owner token locally and sends it only in an Authorization header when **View requests** is used. Bookmark the editor link shown after publishing to reopen the calculator and inbox from that browser. Without that browser's private token, the inbox cannot be recovered in this account-free MVP.

The public form accepts name and email, with optional phone and message. Submitted numeric inputs and the estimate are validated and recomputed server-side. The owner can read the request details and estimate. Public users cannot list requests, and changed calculator specifications cannot submit to another specification's inbox.

`lib/leads.ts` defines the `LeadRepository` boundary and a bounded in-memory implementation. Inboxes expire after 24 hours, hold up to 100 requests each, and disappear on server restart. This implementation requires a single Node.js server process; a multi-instance/serverless deployment will need a shared durable repository first. There are no accounts, database, email delivery, payments or analytics. The UI discloses temporary storage. Replace the repository for durable persistence rather than adding storage code to the math engine.

## Validate and run production

```sh
npm test
npm run lint
npm run build
npm run start
```

Tests cover demo math, rejected executable/invalid formulas, shared URL encoding and validation, tips, editing, lead validation/private access/expiry and API handlers. The SDK integration tests mock only HTTP transport, exercising the real SDK's request serialization and `output_text` handling. These tests do not establish live model access.

For a browser smoke check:

1. Generate the default painting quote (or select its template): **1040 EUR**. Set area to 100: **1300 EUR**. Cleaning and landscaping defaults are **85 EUR** and **1518 EUR**.
2. Edit the title, defaults and tips, save, then publish. Open the public link and confirm the edits and defaults. Test the supplied iframe in an HTML page.
3. Submit a synthetic customer request and check **View requests** in the creator's browser. A request must not be readable without the private owner token.
4. Generate a fuel calculator. Set distance to 420, consumption to 6.4 and price to 1.55: **41.66 EUR**. Legacy fuel sharing remains supported.
5. With an API key, describe a novel calculator such as pool filling time from volume in litres and flow in litres per minute. Check that 1200 L at 20 L/min gives **60 min** and that its source is AI.

Product results use English number formatting. Read `CODEX.md` before changing product behavior or presentation.
