import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/rounds/:id → round + top bid per cell + all bids
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sb = createServiceClient();
  const { data: round, error: rErr } = await sb
    .from("rounds")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });
  if (!round) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: bids, error: bErr } = await sb
    .from("bids")
    .select("*")
    .eq("round_id", params.id)
    .order("amount", { ascending: false });
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });

  // Group by cell_id, keep top bid per cell + count
  const perCell: Record<string, { top: typeof bids[number]; count: number; all: typeof bids }> = {};
  (bids || []).forEach((b) => {
    if (!perCell[b.cell_id]) perCell[b.cell_id] = { top: b, count: 0, all: [] };
    perCell[b.cell_id].count += 1;
    perCell[b.cell_id].all.push(b);
    if (b.amount > perCell[b.cell_id].top.amount) perCell[b.cell_id].top = b;
  });

  return NextResponse.json({
    round,
    bids: bids || [],
    per_cell: perCell,
  });
}

// PATCH /api/rounds/:id  { status: 'closed' | 'finalized' }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const status = body.status;
  if (!["live", "closed", "finalized"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { error } = await sb.from("rounds").update({ status }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
