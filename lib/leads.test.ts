import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryLeadRepository } from "./leads";
import { BUSINESS_DEMOS } from "./business-demos";
import { decodeCalculator, encodeCalculator } from "./share";
import { POST as createInbox } from "@/app/api/lead-collections/route";
import { POST as submitLead } from "@/app/api/leads/route";
import { GET as readInbox } from "@/app/api/lead-collections/[id]/route";

const spec = BUSINESS_DEMOS.painting;
const values = Object.fromEntries(spec.inputs.map((input) => [input.id, input.default]));
const details = { name: "Test Customer", email: "test@example.com", phone: "", message: "Please confirm the scope.", values };
const request = (body: unknown) => new Request("http://localhost/api", { method: "POST", body: JSON.stringify(body) });
afterEach(() => { vi.useRealTimers(); });

describe("temporary lead repository", () => {
  it("stores the deterministic quote and protects owner access", () => {
    const store = new MemoryLeadRepository(), inbox = store.create(encodeCalculator(spec));
    const lead = store.submit({ ...details, calculator: inbox.calculator, result: 0 });
    expect(lead.result).toBe(1040);
    expect(store.read(inbox.collectionId, inbox.ownerToken)).toEqual([lead]);
    expect(inbox.calculator).not.toContain(inbox.ownerToken);
    expect(() => store.read(inbox.collectionId, "")).toThrow();
    expect(() => store.read(inbox.collectionId, "wrong-owner")).toThrow();
    const another = store.create(encodeCalculator(spec));
    expect(() => store.read(inbox.collectionId, another.ownerToken)).toThrow();
  });
  it("rejects invalid email, missing names, huge messages and invalid calculator values", () => {
    const store = new MemoryLeadRepository(), inbox = store.create(encodeCalculator(spec));
    for (const invalid of [{ email: "bad" }, { name: "" }, { message: "x".repeat(1001) },
      { values: {} }, { values: { ...values, area: -1 } }, { values: { ...values, area: "100" } }]) {
      expect(() => store.submit({ ...details, ...invalid, calculator: inbox.calculator })).toThrow();
    }
    expect(store.read(inbox.collectionId, inbox.ownerToken)).toEqual([]);
  });
  it("does not accept submissions for a changed or disabled calculator", () => {
    const store = new MemoryLeadRepository(), inbox = store.create(encodeCalculator(spec));
    const changed = { ...decodeCalculator(inbox.calculator), formula: "area * 999" };
    expect(() => store.submit({ ...details, calculator: encodeCalculator(changed) })).toThrow("has changed");
    expect(() => store.create(encodeCalculator(BUSINESS_DEMOS.cleaning))).toThrow("Enable lead capture");
  });
  it("expires inboxes after 24 hours and does not persist across repositories", () => {
    vi.useFakeTimers();
    const store = new MemoryLeadRepository(), inbox = store.create(encodeCalculator(spec));
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(() => store.submit({ ...details, calculator: inbox.calculator })).toThrow("expired");
    expect(() => store.read(inbox.collectionId, inbox.ownerToken)).toThrow();
    expect(() => new MemoryLeadRepository().submit({ ...details, calculator: inbox.calculator })).toThrow("unavailable");
  });
  it("bounds the number of submissions per inbox", () => {
    const store = new MemoryLeadRepository(), inbox = store.create(encodeCalculator(spec));
    for (let i = 0; i < 100; i++) store.submit({ ...details, calculator: inbox.calculator });
    expect(() => store.submit({ ...details, calculator: inbox.calculator })).toThrow("full");
  });
});

describe("lead API routes", () => {
  it("registers, submits and privately reads the same inbox across route handlers", async () => {
    const created = await createInbox(request({ calculator: encodeCalculator(spec) }));
    expect(created.status).toBe(201);
    const inbox = await created.json();
    const response = await submitLead(request({ ...details, calculator: inbox.calculator }));
    expect(response.status).toBe(201);
    expect(await response.json()).toHaveProperty("reference");
    const context = { params: Promise.resolve({ id: inbox.collectionId }) };
    expect((await readInbox(new Request("http://localhost/api"), context)).status).toBe(404);
    const read = await readInbox(new Request("http://localhost/api", { headers: { Authorization: `Bearer ${inbox.ownerToken}` } }), context);
    expect(read.headers.get("Cache-Control")).toBe("no-store");
    expect((await read.json()).leads[0]).toMatchObject({ name: details.name, result: 1040 });
  });
  it("rejects malformed, oversized and unsafe calculator bodies", async () => {
    const malformed = new Request("http://localhost/api", { method: "POST", body: "{" });
    expect((await submitLead(malformed)).status).toBe(400);
    expect((await createInbox(request({ text: "x".repeat(24001) }))).status).toBe(413);
    const unsafe = Buffer.from(JSON.stringify({ ...spec, formula: "eval(area)" })).toString("base64url");
    expect((await createInbox(request({ calculator: unsafe }))).status).toBe(400);
  });
});
