import { CalculatorSpec } from "./types";
import { validateCalculatorSpec } from "./validate";

export function applyCalculatorEdits(spec: CalculatorSpec, data: FormData): CalculatorSpec {
  const text = (name: string) => String(data.get(name) ?? "").trim();
  const lines = (name: string, max: number) => {
    const items = text(name).split("\n").map((line) => line.trim()).filter(Boolean);
    if (items.length > max) throw new Error(`Use at most ${max} ${name}.`);
    return items;
  };
  if (!text("title") || !text("description") || !text("outputLabel")) throw new Error("Complete the title, description and result label.");
  const inputs = spec.inputs.map((input) => {
    const raw = text(`${input.id}-default`);
    const value = raw === "" ? NaN : Number(raw);
    const label = text(`${input.id}-label`);
    if (!Number.isFinite(value) || !label) throw new Error(`Enter a label and numeric default for ${input.label}.`);
    return { ...input, label, default: value, unit: text(`${input.id}-unit`) };
  });
  // IDs, bounds and formula always come from the validated specification.
  return validateCalculatorSpec({ ...spec, title: text("title"), description: text("description"), inputs,
    output: { ...spec.output, label: text("outputLabel"), unit: text("outputUnit") },
    assumptions: lines("assumptions", 5), tips: lines("tips", 4),
    leadCapture: { enabled: data.get("leadCapture") === "on", collectionId: null },
  }, spec.source);
}
