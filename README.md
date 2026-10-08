# Calculators.si

MVP for a calculator website that turns a natural-language request into a safe deterministic interactive calculator.

The public visual direction intentionally resembles a well-maintained 2008-2012 utility website rather than a generic AI startup landing page.

## Run locally

Use Node.js 24 (the tested version is pinned in `.nvmrc`). Dependencies are pinned in `package.json` and `package-lock.json`.

```sh
npm ci
npm run dev
```

Without an API key, generation uses the local paint, fuel, tiles and percentage demos. No database or other service is needed.

For arbitrary AI-generated calculators, copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` there. Keep the file private and never commit it. In a cloud environment using proxy-backed secrets, use `CALCULATOR_OPENAI_API_KEY` instead and allow its HTTPS destination `api.openai.com`. The cloud binding takes precedence when both are set. `OPENAI_MODEL` defaults to `gpt-5.5`; the chosen model must support Responses API structured output.

The server uses the installed OpenAI SDK's `responses.create` with strict `text.format` JSON schema. The resulting specification must pass the local whitelist math parser before it reaches the calculator. Model output is never executed as code. Incomplete responses and responses without structured text return an error.

## Validate and run production

```sh
npm test
npm run lint
npm run build
npm run start
```

Tests cover demo math, rejected executable/invalid formulas, shared URL encoding and validation, and the generation route. The SDK integration tests mock only HTTP transport, exercising the real SDK's request serialization and `output_text` handling. These tests do not establish live model access.

For a browser smoke check:

1. Generate the default paint example: the default result is **16.3 L**. Set area to 100: **22.0 L**.
2. Generate the fuel example. Set distance to 420, consumption to 6.4 and price to 1.55: **41.66 EUR**.
3. With an API key, describe a novel calculator such as pool filling time from volume in litres and flow in litres per minute. Check that 1200 L at 20 L/min gives **60 min** and that its source is AI.
4. Click **Deli kalkulator** and reload the URL. Sharing stores the specification and its default inputs, not subsequent input edits.

The site formats numbers with the Slovenian decimal comma. Read `CODEX.md` before changing product behavior or presentation.
