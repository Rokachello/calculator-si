import { CalculatorSpec } from "./types";
import { validateFormula } from "./math-engine";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function cleanText(value: unknown, fallback: string, max = 240): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}
function cleanNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function validateCalculatorSpec(raw: unknown, source: CalculatorSpec["source"] = "ai"): CalculatorSpec {
  if (!isPlainObject(raw)) throw new Error("Calculator spec must be an object");
  if (!Array.isArray(raw.inputs) || raw.inputs.length < 1 || raw.inputs.length > 8) {
    throw new Error("Calculator must have between 1 and 8 inputs");
  }
  const seen = new Set<string>();
  const inputs = raw.inputs.map((item) => {
    if (!isPlainObject(item)) throw new Error("Invalid input definition");
    const id = cleanText(item.id, "", 40);
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(id) || seen.has(id)) throw new Error("Invalid or duplicate input id");
    seen.add(id);
    const defaultValue = cleanNumber(item.default, 0);
    const min = item.min === null ? null : cleanNumber(item.min, defaultValue);
    const max = item.max === null ? null : cleanNumber(item.max, defaultValue);
    if ((min !== null && max !== null && min > max) ||
        (min !== null && defaultValue < min) || (max !== null && defaultValue > max)) {
      throw new Error(`Default value for ${id} must be within its input limits`);
    }
    return {
      id, label: cleanText(item.label, id, 80), unit: cleanText(item.unit, "", 24),
      default: defaultValue, min, max,
      step: Math.max(0.000001, cleanNumber(item.step, 1)),
    };
  });

  if (!isPlainObject(raw.output)) throw new Error("Missing output definition");
  const formula = cleanText(raw.formula, "", 500);
  if (!formula) throw new Error("Missing formula");
  const sampleValues = Object.fromEntries(inputs.map((input) => [input.id, input.default]));
  validateFormula(formula, inputs.map((input) => input.id), sampleValues);

  const assumptions = Array.isArray(raw.assumptions)
    ? raw.assumptions.filter((x): x is string => typeof x === "string").slice(0, 5).map((x) => x.slice(0, 180))
    : [];

  // Old shared URLs have no tips or lead settings; keep them readable.
  const tips = Array.isArray(raw.tips)
    ? raw.tips.filter((x): x is string => typeof x === "string")
      .map((x) => x.trim().slice(0, 180)).filter(Boolean).slice(0, 4)
    : [];
  const lead = isPlainObject(raw.leadCapture) ? raw.leadCapture : {};
  const collectionId = typeof lead.collectionId === "string" && /^[a-f0-9-]{36}$/.test(lead.collectionId)
    ? lead.collectionId : null;

  return {
    version: 1,
    title: cleanText(raw.title, "AI calculator", 100),
    description: cleanText(raw.description, "Interactive calculator generated from your request.", 280),
    inputs, formula,
    output: {
      label: cleanText(raw.output.label, "Result", 80),
      unit: cleanText(raw.output.unit, "", 24),
      decimals: Math.max(0, Math.min(6, Math.round(cleanNumber(raw.output.decimals, 2)))),
    },
    assumptions,
    tips,
    leadCapture: { enabled: lead.enabled === true, collectionId },
    confidenceNote: cleanText(raw.confidenceNote, "Check assumptions before relying on this result.", 220),
    source,
  };
}
