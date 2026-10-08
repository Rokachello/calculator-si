import OpenAI from "openai";
import { NextResponse } from "next/server";
import { demoCalculatorForPrompt } from "@/lib/demo";
import { validateCalculatorSpec } from "@/lib/validate";

export const runtime = "nodejs";

const CALCULATOR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "inputs", "formula", "output", "assumptions", "tips", "confidenceNote"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    inputs: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "unit", "default", "min", "max", "step"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          unit: { type: "string" },
          default: { type: "number" },
          min: { anyOf: [{ type: "number" }, { type: "null" }] },
          max: { anyOf: [{ type: "number" }, { type: "null" }] },
          step: { type: "number" }
        }
      }
    },
    formula: { type: "string" },
    output: {
      type: "object",
      additionalProperties: false,
      required: ["label", "unit", "decimals"],
      properties: {
        label: { type: "string" },
        unit: { type: "string" },
        decimals: { type: "integer", minimum: 0, maximum: 6 }
      }
    },
    assumptions: { type: "array", maxItems: 5, items: { type: "string" } },
    tips: { type: "array", minItems: 0, maxItems: 4, items: { type: "string" } },
    confidenceNote: { type: "string" }
  }
} as const;

const INSTRUCTIONS = `You generate small deterministic calculators for Calculators.si.
Return only a calculator specification matching the schema.
The formula is NOT JavaScript. It is a safe math expression parsed by our engine.
Allowed operators: + - * / ^ and parentheses.
Allowed functions: abs(x), sqrt(x), round(x), floor(x), ceil(x), min(a,b), max(a,b), pow(a,b).
Formula variables must exactly match input ids.
Use only numeric calculator inputs, with one numeric result.
Use the language of the user's request for the calculator title, description, labels, assumptions, tips and confidence note.
Support compact business quote, estimate and ROI calculators without inventing prices or guaranteed returns.
Use short ASCII input ids such as distance, price, area, rate.
Prefer SI units and EUR when the request implies Slovenia.
Do not invent laws, tax brackets, medical recommendations, official rates, or changing external facts.
If a request depends on regulated, medical, legal, tax, benefits, or current official data, build only the generic mathematical structure if possible and explicitly say which official value the user must supply as an input.
Keep the calculator compact: normally 2-6 inputs.
Make assumptions explicit.
Include 0-4 short, specific practical tips. Do not present medical, legal or financial advice as authoritative.
Never emit code, HTML, scripts, URLs, or executable content.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt || prompt.length > 1000) {
      return NextResponse.json({ error: "Prompt must contain 1-1000 characters." }, { status: 400 });
    }
    const apiKey = process.env.CALCULATOR_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ calculator: demoCalculatorForPrompt(prompt), mode: "demo" });
    }
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions: INSTRUCTIONS,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "calculator_spec",
          strict: true,
          schema: CALCULATOR_SCHEMA,
        },
      },
    });
    if (response.status !== "completed" || !response.output_text) {
      throw new Error("The model did not return a complete calculator. Please try again.");
    }
    const raw = JSON.parse(response.output_text);
    const calculator = validateCalculatorSpec(raw, "ai");
    return NextResponse.json({ calculator, mode: "ai" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
