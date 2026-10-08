import { leadRepository } from "@/lib/leads";
import { leadErrorResponse } from "@/lib/lead-api";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
    return Response.json({ leads: leadRepository.read(id, token) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return leadErrorResponse(error); }
}
