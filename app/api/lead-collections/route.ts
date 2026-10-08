import { leadRepository } from "@/lib/leads";
import { leadErrorResponse, readLeadBody } from "@/lib/lead-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readLeadBody(request);
    return Response.json(leadRepository.create(typeof body?.calculator === "string" ? body.calculator : ""),
      { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return leadErrorResponse(error); }
}
