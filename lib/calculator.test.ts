import { describe, expect, it } from "vitest";
import { demoCalculatorForPrompt } from "./demo";
import { evaluateFormula } from "./math-engine";
import { decodeCalculator, encodeCalculator } from "./share";
import { validateCalculatorSpec } from "./validate";

describe("deterministic calculators", () => {
  it.each([
    ["barva", 16.28], ["gorivo", 20.15], ["ploscice", 13.2], ["odstotek", 15],
  ])("validates and calculates the %s demo", (prompt, expected) => {
    const spec = validateCalculatorSpec(demoCalculatorForPrompt(prompt), "demo");
    const values = Object.fromEntries(spec.inputs.map((input) => [input.id, input.default]));
    expect(evaluateFormula(spec.formula, values)).toBeCloseTo(expected);
  });

  it("recalculates fuel from user inputs", () => {
    const spec = demoCalculatorForPrompt("gorivo");
    expect(evaluateFormula(spec.formula, { distance: 420, consumption: 6.4, price: 1.55 })).toBeCloseTo(41.664);
  });

  it.each([
    ["2 + 3 * 4", 14], ["(2 + 3) * 4", 20], ["2 ^ 3 ^ 2", 512],
    ["-2 + abs(-3)", 1], ["sqrt(9) + round(1.6) + floor(1.8) + ceil(1.2)", 8],
    ["max(2, min(3, 4)) + pow(2, 3)", 11],
  ])("evaluates whitelisted math: %s", (formula, expected) => {
    expect(evaluateFormula(formula, {})).toBe(expected);
  });

  it.each([
    "process.exit()", "eval(1)", "Function(1)", "import(1)", "x.constructor", "x;1", "x[0]", "unknown + 1",
    "1 / 0", "sqrt(-1)", "(1 + 2", "1 2", "",
  ])("rejects unsupported or invalid formulas: %s", (formula) => {
    expect(() => evaluateFormula(formula, { x: 1 })).toThrow();
  });

  it("rejects invalid calculator inputs and generated code", () => {
    const spec = demoCalculatorForPrompt("barva");
    expect(() => validateCalculatorSpec({ ...spec, inputs: [] })).toThrow();
    expect(() => validateCalculatorSpec({ ...spec, inputs: Array(9).fill(spec.inputs[0]) })).toThrow();
    expect(() => validateCalculatorSpec({ ...spec, inputs: [spec.inputs[0], spec.inputs[0]] })).toThrow();
    expect(() => validateCalculatorSpec({ ...spec, formula: "eval(area)" })).toThrow();
  });
});

describe("shared URLs", () => {
  it("round-trips the specification, defaults and Unicode text", () => {
    const spec = { ...demoCalculatorForPrompt("barva"), title: "Količina barve – č, š, ž" };
    const encoded = encodeCalculator(spec);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeCalculator(encoded)).toEqual(spec);
  });

  it("rejects corrupt, oversized and executable shared content", () => {
    expect(() => decodeCalculator("invalid")).toThrow();
    expect(() => decodeCalculator("a".repeat(12001))).toThrow();
    const spec = { ...demoCalculatorForPrompt("barva"), formula: "eval(area)" };
    expect(() => decodeCalculator(encodeCalculator(spec))).toThrow();
  });
});
