import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const patch: {
    active?: boolean;
    type?: string;
    n?: string;
    row?: string;
    rot?: number;
  } = {};
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.type === "string") patch.type = body.type;
  if (typeof body.n === "string") patch.n = body.n;
  if (typeof body.row === "string") patch.row = body.row;
  if (typeof body.rot === "number") patch.rot = body.rot;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { error } = await sb.from("parking_cells").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
