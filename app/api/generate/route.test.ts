import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { evaluateFormula } from "@/lib/math-engine";

const request = (prompt: unknown) => new Request("http://localhost/api/generate", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }),
});

const novelCalculator = {
  title: "Čas polnjenja bazena", description: "Čas iz prostornine in pretoka.",
  inputs: [
    { id: "volume", label: "Prostornina", unit: "L", default: 1200, min: 0, max: null, step: 1 },
    { id: "flow", label: "Pretok", unit: "L/min", default: 20, min: 0.1, max: null, step: 0.1 },
  ],
  formula: "volume / flow", output: { label: "Čas", unit: "min", decimals: 1 },
  assumptions: ["Pretok je konstanten."], confidenceNote: "Preverite dejanski pretok.",
  tips: ["Izmerite pretok cevi pred polnjenjem."],
};

function mockOpenAI(outputText: string, status = "completed") {
  vi.stubEnv("OPENAI_API_KEY", "test-only-not-a-real-key");
  // Mock only HTTP: the installed OpenAI SDK must serialize the request and
  // derive output_text from a Responses API message, rather than a mocked SDK.
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
    id: "resp_test", object: "response", created_at: 0, status,
    output: [{ id: "msg_test", type: "message", role: "assistant", status: "completed",
      content: [{ type: "output_text", text: outputText, annotations: [] }] }],
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
beforeEach(() => {
  vi.stubEnv("CALCULATOR_OPENAI_API_KEY", "");
  vi.stubEnv("OPENAI_API_KEY", "");
});

describe("calculator generation route", () => {
  it("uses the local demo without a key or network request", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetch = vi.spyOn(globalThis, "fetch");
    const response = await POST(request("barva"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: "demo", calculator: { source: "demo", formula: "area * coats / coverage * (1 + reserve / 100)" } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["", " ", "x".repeat(1001), 123, null])("rejects invalid prompt %j before calling OpenAI", async (prompt) => {
    const fetch = vi.spyOn(globalThis, "fetch");
    expect((await POST(request(prompt))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses Responses structured output with the installed SDK and validates a novel calculator", async () => {
    vi.stubEnv("OPENAI_MODEL", "gpt-5.5");
    const fetch = mockOpenAI(JSON.stringify(novelCalculator));
    const response = await POST(request("Koliko minut potrebujem za polnjenje bazena?"));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({ mode: "ai", calculator: { source: "ai", formula: "volume / flow" } });
    expect(evaluateFormula(payload.calculator.formula, { volume: 1200, flow: 20 })).toBe(60);
    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = fetch.mock.calls[0];
    expect(String(url)).toBe("https://api.openai.com/v1/responses");
    const body = JSON.parse(options!.body as string);
    expect(body.model).toBe("gpt-5.5");
    expect(body.text.format).toMatchObject({ type: "json_schema", name: "calculator_spec", strict: true,
      schema: { additionalProperties: false, properties: { inputs: { maxItems: 8 } } } });
    expect(body).not.toHaveProperty("response_format");
    expect(body.text.format.schema.required).toContain("tips");
    expect(body.text.format.schema.properties.tips).toMatchObject({ minItems: 0, maxItems: 4 });
    expect(body.instructions).toContain("language of the user's request");
    expect(payload.calculator.tips).toEqual(novelCalculator.tips);
  });

  it("rejects executable model output through the safe math parser", async () => {
    mockOpenAI(JSON.stringify({ ...novelCalculator, formula: "eval(volume)" }));
    const response = await POST(request("bazen"));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: "Unsupported function: eval" });
  });

  it("supports the cloud credential binding", async () => {
    mockOpenAI(JSON.stringify(novelCalculator));
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("CALCULATOR_OPENAI_API_KEY", "test-only-cloud-key");
    expect((await POST(request("bazen"))).status).toBe(200);
  });

  it.each(["incomplete", "failed"])("does not accept a %s response", async (status) => {
    mockOpenAI(JSON.stringify(novelCalculator), status);
    const response = await POST(request("bazen"));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: "The model did not return a complete calculator. Please try again." });
  });

  it("reports missing structured output", async () => {
    mockOpenAI("");
    expect((await POST(request("bazen"))).status).toBe(500);
  });
});
