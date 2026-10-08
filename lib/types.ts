export type CalculatorInput = {
  id: string;
  label: string;
  unit: string;
  default: number;
  min: number | null;
  max: number | null;
  step: number;
};

export type CalculatorSpec = {
  version: 1;
  title: string;
  description: string;
  inputs: CalculatorInput[];
  formula: string;
  output: {
    label: string;
    unit: string;
    decimals: number;
  };
  assumptions: string[];
  confidenceNote: string;
  source: "ai" | "demo" | "verified";
};
