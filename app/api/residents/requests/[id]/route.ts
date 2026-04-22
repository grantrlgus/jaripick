import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/residents/requests/:id — for resident app to poll approval state
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("resident_requests")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
