# Codex working instructions - Calculators.si

## Goal
Build the smallest reliable product that turns a natural-language request into a usable deterministic calculator.

## Non-negotiable architecture rule
Never execute code produced by an LLM. Do not introduce eval(), new Function(), dynamic imports from generated content, generated SQL, generated HTML, or arbitrary expression evaluators with code execution capability.

The LLM may propose a math expression only. All formulas must pass through the local whitelist parser in `lib/math-engine.ts`.

## Current scope: v0.1
Keep scope intentionally narrow:
- numeric inputs only,
- one numeric result,
- max 8 inputs,
- share through URL encoding,
- no accounts,
- no database,
- no payments,
- no admin,
- no B2B features.

## Quality bar
Before marking a task complete:
1. npm test
2. npm run lint
3. npm run build
4. Manually verify one AI/demo-generated calculator and one shared URL.

## Product principles
- AI understands the request; deterministic code performs the calculation.
- Make assumptions visible.
- Do not pretend an AI-generated calculator is verified.
- Regulated/current-data calculators must not invent external values; require those values as user inputs until a verified data source exists.
- Prefer simplicity over framework additions.

## Visual direction - intentionally not AI-slop
The public site should feel like a useful, trustworthy web utility from roughly 2008-2012 that has been carefully maintained, not like a 2026 AI startup landing page.

Preserve these cues unless a task explicitly changes them:
- fixed-width desktop content area around 980px, responsive on small screens,
- blue utility-site header/navigation,
- light gray page background and white bordered content panels,
- subtle vertical gradients, 1px borders and small shadows,
- compact typography and information-dense layouts,
- form tables where appropriate,
- conventional rectangular/beveled buttons with only small corner radii,
- green result box for primary numeric output,
- normal links and breadcrumb navigation,
- restrained use of badges.

Avoid:
- giant hero typography,
- oversized whitespace,
- pill-heavy interfaces,
- glassmorphism,
- purple/blue AI gradients,
- floating cards with huge radii,
- decorative sparkles, AI mascots, abstract blobs,
- excessive animation,
- copy that constantly announces that the product uses AI.

The AI generator is a feature inside a calculator website, not the visual identity of the website.
