import { CalculatorSpec } from "./types";
import { BUSINESS_DEMOS } from "./business-demos";

export function demoCalculatorForPrompt(prompt: string): CalculatorSpec {
  const p = prompt.toLowerCase();
  if (p.includes("cleaning") || p.includes("ciscen")) return BUSINESS_DEMOS.cleaning;
  if (p.includes("landscap") || p.includes("garden")) return BUSINESS_DEMOS.landscaping;
  if ((p.includes("paint") || p.includes("barv")) && (p.includes("quote") || p.includes("estimate"))) return BUSINESS_DEMOS.painting;
  if (p.includes("goriv") || p.includes("fuel") || p.includes("vozn")) {
    return {
      version: 1, tips: [], leadCapture: { enabled: false, collectionId: null }, title: "Fuel trip cost",
      description: "Estimate trip fuel cost from distance, vehicle consumption and fuel price.",
      inputs: [
        { id: "distance", label: "Distance", unit: "km", default: 200, min: 0, max: 100000, step: 1 },
        { id: "consumption", label: "Fuel consumption", unit: "L/100 km", default: 6.5, min: 0, max: 100, step: 0.1 },
        { id: "price", label: "Fuel price", unit: "EUR/L", default: 1.55, min: 0, max: 20, step: 0.01 }
      ],
      formula: "distance * consumption / 100 * price",
      output: { label: "Fuel cost", unit: "EUR", decimals: 2 },
      assumptions: ["Distance is the total trip distance.", "Consumption is the average vehicle consumption."],
      confidenceNote: "Calculated deterministically from your inputs.", source: "demo"
    };
  }
  if (p.includes("barv") || p.includes("paint")) {
    return {
      version: 1, tips: [], leadCapture: { enabled: false, collectionId: null }, title: "Paint quantity",
      description: "Estimate paint quantity from area, coats, coverage and an allowance.",
      inputs: [
        { id: "area", label: "Area", unit: "m2", default: 74, min: 0, max: 100000, step: 1 },
        { id: "coats", label: "Coats", unit: "", default: 2, min: 1, max: 10, step: 1 },
        { id: "coverage", label: "Coverage", unit: "m2/L", default: 10, min: 0.1, max: 100, step: 0.1 },
        { id: "reserve", label: "Allowance", unit: "%", default: 10, min: 0, max: 100, step: 1 }
      ],
      formula: "area * coats / coverage * (1 + reserve / 100)",
      output: { label: "Paint needed", unit: "L", decimals: 1 },
      assumptions: ["Manufacturer coverage applies to the surface and application method.", "The allowance covers minor losses and touch-ups."],
      confidenceNote: "Check the paint manufacturer’s coverage before buying.", source: "demo"
    };
  }
  if (p.includes("plosc") || p.includes("tile")) {
    return {
      version: 1, tips: [], leadCapture: { enabled: false, collectionId: null }, title: "Tile quantity",
      description: "Estimate the tile area including cutting and waste.",
      inputs: [
        { id: "length", label: "Length", unit: "m", default: 4, min: 0, max: 1000, step: 0.01 },
        { id: "width", label: "Width", unit: "m", default: 3, min: 0, max: 1000, step: 0.01 },
        { id: "reserve", label: "Allowance", unit: "%", default: 10, min: 0, max: 100, step: 1 }
      ],
      formula: "length * width * (1 + reserve / 100)",
      output: { label: "Tile area needed", unit: "m2", decimals: 2 },
      assumptions: ["The calculation does not subtract openings or fixed features."],
      confidenceNote: "Consider a larger allowance for diagonal layouts.", source: "demo"
    };
  }
  return {
    version: 1, tips: [], leadCapture: { enabled: false, collectionId: null }, title: "Percentage of a value",
    description: "A local percentage demo. Custom requests require AI generation.",
    inputs: [
      { id: "value", label: "Value", unit: "", default: 100, min: null, max: null, step: 1 },
      { id: "percent", label: "Percentage", unit: "%", default: 15, min: null, max: null, step: 1 }
    ],
    formula: "value * percent / 100",
    output: { label: "Result", unit: "", decimals: 2 },
    assumptions: ["This is a local demo, not a calculator generated for your request."],
    confidenceNote: "Use a matching demo template or enable AI generation for custom requests.", source: "demo"
  };
}
