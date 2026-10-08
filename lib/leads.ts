import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { decodeCalculator, encodeCalculator } from "./share";
import { evaluateFormula } from "./math-engine";

export type Lead = {
  id: string; createdAt: string; name: string; email: string; phone: string; message: string;
  values: Record<string, number>; result: number; unit: string;
};

export class LeadError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

type Collection = { calculator: string; ownerHash: Buffer; expiresAt: number; leads: Lead[] };

// Replace this boundary with durable storage later. No leads or owner tokens are
// put into public URLs. This MVP requires one server process and expires in 24h.
export interface LeadRepository {
  create(calculator: string): { calculator: string; collectionId: string; ownerToken: string };
  submit(raw: unknown): Lead;
  read(id: string, ownerToken: string): Lead[];
}

export class MemoryLeadRepository implements LeadRepository {
  private collections = new Map<string, Collection>();
  private prune() {
    for (const [id, entry] of this.collections) if (entry.expiresAt <= Date.now()) this.collections.delete(id);
  }
  create(encoded: string) {
    this.prune();
    if (this.collections.size >= 1000) throw new LeadError("Request inbox capacity reached. Please try again later.", 503);
    const spec = decodeCalculator(encoded);
    if (!spec.leadCapture.enabled) throw new LeadError("Enable lead capture before creating an inbox.", 400);
    const collectionId = randomUUID();
    const ownerToken = randomBytes(32).toString("hex");
    const calculator = encodeCalculator({ ...spec, leadCapture: { enabled: true, collectionId } });
    this.collections.set(collectionId, {
      calculator, ownerHash: createHash("sha256").update(ownerToken).digest(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, leads: [],
    });
    return { calculator, collectionId, ownerToken };
  }
  submit(raw: unknown): Lead {
    this.prune();
    if (!raw || typeof raw !== "object") throw new LeadError("Invalid request details.", 400);
    const body = raw as Record<string, unknown>;
    const spec = decodeCalculator(typeof body.calculator === "string" ? body.calculator : "");
    const entry = spec.leadCapture.enabled && spec.leadCapture.collectionId
      ? this.collections.get(spec.leadCapture.collectionId) : undefined;
    if (!entry) throw new LeadError("This request inbox has expired or is unavailable. Contact the business directly.", 410);
    if (encodeCalculator(spec) !== entry.calculator) throw new LeadError("This calculator has changed. Open the original published link.", 400);
    if (entry.leads.length >= 100) throw new LeadError("This inbox is full. Contact the business directly.", 429);
    const text = (key: string, max: number, required = false) => {
      const value = typeof body[key] === "string" ? body[key].trim() : "";
      if ((required && !value) || value.length > max) throw new LeadError(`Please enter a valid ${key}.`, 400);
      return value;
    };
    const name = text("name", 80, true), email = text("email", 254, true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new LeadError("Please enter a valid email.", 400);
    const supplied = body.values && typeof body.values === "object" ? body.values as Record<string, unknown> : {};
    const values: Record<string, number> = {};
    for (const input of spec.inputs) {
      const value = supplied[input.id];
      if (typeof value !== "number" || !Number.isFinite(value) ||
          (input.min !== null && value < input.min) || (input.max !== null && value > input.max)) {
        throw new LeadError("Please check the calculator inputs before submitting.", 400);
      }
      values[input.id] = value;
    }
    const result = evaluateFormula(spec.formula, values);
    const lead: Lead = { id: randomUUID(), createdAt: new Date().toISOString(), name, email,
      phone: text("phone", 40), message: text("message", 1000), values, result, unit: spec.output.unit };
    entry.leads.push(lead);
    return lead;
  }
  read(id: string, ownerToken: string): Lead[] {
    this.prune();
    const entry = this.collections.get(id);
    if (!entry || !timingSafeEqual(entry.ownerHash, createHash("sha256").update(ownerToken).digest())) {
      throw new LeadError("The inbox is unavailable or your private access key is missing.", 404);
    }
    return entry.leads.map((lead) => ({ ...lead, values: { ...lead.values } }));
  }
}

const processState = globalThis as typeof globalThis & { calculatorLeadRepository?: LeadRepository };
export const leadRepository = processState.calculatorLeadRepository ??= new MemoryLeadRepository();
