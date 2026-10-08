import { CalculatorSpec } from "./types";
import { validateCalculatorSpec } from "./validate";

const common = {
  version: 1, source: "demo", confidenceNote: "An estimate, not a binding quote. Confirm the scope and rates before agreeing a price.",
  leadCapture: { enabled: false, collectionId: null },
};

export const BUSINESS_DEMOS: Record<string, CalculatorSpec> = {
  painting: validateCalculatorSpec({
    ...common, title: "Painting quote calculator",
    description: "Estimate a painting job from surface area, coats, labour and materials.",
    inputs: [
      { id: "area", label: "Paintable area", unit: "m²", default: 80, min: 0, max: 100000, step: 1 },
      { id: "coats", label: "Number of coats", unit: "", default: 2, min: 1, max: 10, step: 1 },
      { id: "labour", label: "Labour per m² per coat", unit: "EUR", default: 5, min: 0, max: null, step: 0.5 },
      { id: "materials", label: "Materials per m² per coat", unit: "EUR", default: 1.5, min: 0, max: null, step: 0.1 },
    ],
    formula: "area * coats * (labour + materials)", output: { label: "Estimated quote", unit: "EUR", decimals: 2 },
    assumptions: ["Rates are examples; replace them with your own prices.", "Preparation, access costs and tax are not included."],
    tips: ["Measure walls and ceilings separately before quoting.", "Confirm the surface condition and any preparation work."],
    leadCapture: { enabled: true, collectionId: null },
  }, "demo"),
  cleaning: validateCalculatorSpec({
    ...common, title: "Cleaning quote calculator",
    description: "Estimate a cleaning visit from floor area, expected productivity and your hourly rate.",
    inputs: [
      { id: "area", label: "Floor area", unit: "m²", default: 120, min: 0, max: 100000, step: 1 },
      { id: "productivity", label: "Area cleaned per hour", unit: "m²/h", default: 40, min: 0.1, max: null, step: 1 },
      { id: "rate", label: "Hourly rate", unit: "EUR/h", default: 25, min: 0, max: null, step: 0.5 },
      { id: "supplies", label: "Supplies per visit", unit: "EUR", default: 10, min: 0, max: null, step: 1 },
    ],
    formula: "area / productivity * rate + supplies", output: { label: "Estimated visit price", unit: "EUR", decimals: 2 },
    assumptions: ["Rates are examples; use your own service prices.", "One routine visit; specialist cleaning and tax are excluded."],
    tips: ["Agree which rooms and tasks the visit includes.", "Use measured job times to adjust your productivity estimate."],
  }, "demo"),
  landscaping: validateCalculatorSpec({
    ...common, title: "Landscaping estimate calculator",
    description: "Estimate a garden project from area, materials, labour and a contingency allowance.",
    inputs: [
      { id: "area", label: "Project area", unit: "m²", default: 50, min: 0, max: 100000, step: 1 },
      { id: "materials", label: "Materials per m²", unit: "EUR", default: 18, min: 0, max: null, step: 0.5 },
      { id: "hours", label: "Labour hours", unit: "h", default: 16, min: 0, max: null, step: 0.5 },
      { id: "rate", label: "Hourly rate", unit: "EUR/h", default: 30, min: 0, max: null, step: 0.5 },
      { id: "reserve", label: "Contingency", unit: "%", default: 10, min: 0, max: 100, step: 1 },
    ],
    formula: "(area * materials + hours * rate) * (1 + reserve / 100)", output: { label: "Estimated project cost", unit: "EUR", decimals: 2 },
    assumptions: ["Rates are examples; confirm local material and labour costs.", "Waste removal, permits and tax are not included."],
    tips: ["Check access and soil condition before estimating labour.", "List waste removal and delivery as separate quote items."],
  }, "demo"),
};
