import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

// GET ?complex=&round_id=&dong=&ho=&status=
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const complex = searchParams.get("complex") || DEFAULT_COMPLEX;
  const round_id = searchParams.get("round_id");
  const dong = searchParams.get("dong");
  const ho = searchParams.get("ho");
  const status = searchParams.get("status");
  const sb = createServiceClient();
  let q = sb.from("payments").select("*").eq("complex", complex);
  if (round_id) q = q.eq("round_id", round_id);
  if (dong) q = q.eq("dong", dong);
  if (ho) q = q.eq("ho", ho);
  if (status) q = q.eq("status", status);
  q = q.order("due_date", { ascending: true });
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// PATCH /api/payments  { id, status, paid_at?, memo? }
export async function PATCH(req: Request) {
  const body = await req.json();
  const id = body.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const status = body.status;
  if (status && !["pending", "paid", "overdue", "refunded"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const patch: any = {};
  if (status) patch.status = status;
  if (status === "paid" && !body.paid_at) patch.paid_at = new Date().toISOString();
  else if (body.paid_at !== undefined) patch.paid_at = body.paid_at;
  if (body.memo !== undefined) patch.memo = body.memo;
  const sb = createServiceClient();
  const { error } = await sb.from("payments").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
