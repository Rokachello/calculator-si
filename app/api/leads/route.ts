import { leadRepository } from "@/lib/leads";
import { leadErrorResponse, readLeadBody } from "@/lib/lead-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const lead = leadRepository.submit(await readLeadBody(request));
    return Response.json({ reference: lead.id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return leadErrorResponse(error); }
}
