import { describe, expect, it } from "vitest";
import { BUSINESS_DEMOS } from "./business-demos";
import { demoCalculatorForPrompt } from "./demo";
import { validateCalculatorSpec } from "./validate";
import { decodeCalculator, encodeCalculator } from "./share";
import { evaluateFormula } from "./math-engine";
import { applyCalculatorEdits } from "./edit";

const spec = BUSINESS_DEMOS.painting;
function editData() {
  const data = new FormData();
  data.set("title", spec.title); data.set("description", spec.description);
  data.set("outputLabel", spec.output.label); data.set("outputUnit", spec.output.unit);
  data.set("assumptions", spec.assumptions.join("\n")); data.set("tips", spec.tips.join("\n"));
  data.set("leadCapture", "on");
  for (const input of spec.inputs) {
    data.set(`${input.id}-label`, input.label); data.set(`${input.id}-default`, String(input.default)); data.set(`${input.id}-unit`, input.unit);
  }
  return data;
}

describe("v0.2 calculator schema", () => {
  it("accepts empty tips and normalises four short suggestions", () => {
    expect(validateCalculatorSpec({ ...spec, tips: [] }).tips).toEqual([]);
    expect(validateCalculatorSpec({ ...spec, tips: ["  Measure walls. ", 42, "", "x".repeat(200), "Third", "Fourth", "Fifth"] }).tips)
      .toEqual(["Measure walls.", "x".repeat(180), "Third", "Fourth"]);
  });
  it("opens legacy shares with no tips or lead fields", () => {
    const legacy = { ...demoCalculatorForPrompt("fuel") } as Record<string, unknown>;
    delete legacy.tips; delete legacy.leadCapture;
    const encoded = Buffer.from(JSON.stringify(legacy)).toString("base64url");
    expect(decodeCalculator(encoded)).toMatchObject({ tips: [], leadCapture: { enabled: false, collectionId: null } });
  });
  it("does not trust a verified badge supplied by a shared URL", () => {
    expect(decodeCalculator(encodeCalculator({ ...spec, source: "verified" })).source).toBe("ai");
  });
  it("round-trips tips and lead settings in a public URL", () => {
    expect(decodeCalculator(encodeCalculator(spec))).toEqual(spec);
  });
  it.each([["painting", 1040], ["cleaning", 85], ["landscaping", 1518]])("calculates the %s business template", (name, result) => {
    const demo = BUSINESS_DEMOS[name];
    const values = Object.fromEntries(demo.inputs.map((input) => [input.id, input.default]));
    expect(evaluateFormula(demo.formula, values)).toBeCloseTo(result);
    expect(demo.tips.length).toBeGreaterThan(0);
  });
  it("validates edited labels, defaults, units and text without accepting code edits", () => {
    const data = editData();
    data.set("title", "My painting service"); data.set("area-default", "100"); data.set("area-label", "Wall area");
    data.set("labour-unit", "GBP"); data.set("outputUnit", "GBP"); data.set("tips", "Measure first.\nConfirm access.");
    data.set("formula", "eval(area)"); data.set("area-id", "untrusted");
    const edited = applyCalculatorEdits(spec, data);
    expect(edited.title).toBe("My painting service"); expect(edited.inputs[0]).toMatchObject({ id: "area", label: "Wall area", default: 100 });
    expect(edited.output.unit).toBe("GBP"); expect(edited.tips).toEqual(["Measure first.", "Confirm access."]);
    expect(edited.formula).toBe(spec.formula);
    expect(evaluateFormula(edited.formula, Object.fromEntries(edited.inputs.map((input) => [input.id, input.default])))).toBe(1300);
  });
  it("rejects empty, non-finite, out-of-bounds or unsafe formula defaults", () => {
    for (const value of ["", "NaN", "Infinity", "-1"]) {
      const data = editData(); data.set("area-default", value);
      expect(() => applyCalculatorEdits(spec, data)).toThrow();
    }
    expect(() => validateCalculatorSpec({ ...spec, inputs: spec.inputs.map((input) => ({ ...input, min: 10, max: 1 })) })).toThrow();
    const cleaning = BUSINESS_DEMOS.cleaning;
    expect(() => validateCalculatorSpec({ ...cleaning, inputs: cleaning.inputs.map((input) => input.id === "productivity" ? { ...input, min: null, default: 0 } : input) })).toThrow("Division by zero");
  });
  it("rejects more than four tips in the editor rather than silently dropping them", () => {
    const data = editData(); data.set("tips", "1\n2\n3\n4\n5");
    expect(() => applyCalculatorEdits(spec, data)).toThrow("at most 4");
  });
});
