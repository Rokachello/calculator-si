import { LeadError } from "./leads";

export async function readLeadBody(request: Request) {
  const text = await request.text();
  if (text.length > 24000) throw new LeadError("Request is too large.", 413);
  try { return JSON.parse(text); } catch { throw new LeadError("Invalid JSON request.", 400); }
}

export function leadErrorResponse(error: unknown) {
  return Response.json({ error: error instanceof LeadError ? error.message : "Invalid calculator or request details." },
    { status: error instanceof LeadError ? error.status : 400, headers: { "Cache-Control": "no-store" } });
}
