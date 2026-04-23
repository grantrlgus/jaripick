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

  // 확정 시 payments 테이블에 월별 분납 스케줄 자동 생성
  if (status === "finalized") {
    await populatePayments(sb, params.id);
  }
  return NextResponse.json({ ok: true });
}

async function populatePayments(
  sb: ReturnType<typeof import("@/lib/supabase").createServiceClient>,
  roundId: string
) {
  const { data: round } = await sb
    .from("rounds")
    .select("*")
    .eq("id", roundId)
    .maybeSingle();
  if (!round) return;

  const { data: bids } = await sb
    .from("bids")
    .select("*")
    .eq("round_id", roundId)
    .order("amount", { ascending: false });
  if (!bids || bids.length === 0) return;

  // 셀별 최고가 선정
  const topByCell: Record<string, any> = {};
  for (const b of bids) {
    if (!topByCell[b.cell_id] || b.amount > topByCell[b.cell_id].amount) {
      topByCell[b.cell_id] = b;
    }
  }

  // contract_start ~ contract_end 월별로 펼침
  const start = new Date(round.contract_start);
  const end = new Date(round.contract_end);
  const months: { period: string; due: string }[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d.getTime() <= end.getTime()) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const period = `${y}-${String(m + 1).padStart(2, "0")}`;
    // 납부일 = 월 말일
    const last = new Date(y, m + 1, 0);
    months.push({ period, due: last.toISOString().slice(0, 10) });
    d.setMonth(d.getMonth() + 1);
  }
  if (months.length === 0) return;

  const rows: any[] = [];
  for (const top of Object.values(topByCell)) {
    for (const m of months) {
      rows.push({
        complex: round.complex,
        round_id: roundId,
        cell_id: top.cell_id,
        dong: top.dong,
        ho: top.ho,
        name: top.name,
        period: m.period,
        amount: top.amount,
        status: "pending",
        due_date: m.due,
      });
    }
  }
  // UNIQUE 제약 있으니 upsert
  await sb.from("payments").upsert(rows, { onConflict: "round_id,cell_id,dong,ho,period", ignoreDuplicates: true });
}
