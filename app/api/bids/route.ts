import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET ?round_id=... → all bids for a round (for resident app list view)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const round_id = searchParams.get("round_id");
  if (!round_id) return NextResponse.json({ error: "round_id required" }, { status: 400 });
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("bids")
    .select("*")
    .eq("round_id", round_id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST new bid — enforces "strictly higher than current top" per cell.
// Body: { round_id, cell_id, dong, ho, name, amount }
export async function POST(req: Request) {
  const body = await req.json();
  const { round_id, cell_id, dong, ho, name, amount } = body;
  if (!round_id || !cell_id || !dong || !ho || !name || !amount) {
    return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ error: "금액이 올바르지 않아요" }, { status: 400 });
  }
  const sb = createServiceClient();

  // Check round is live
  const { data: round } = await sb
    .from("rounds")
    .select("status")
    .eq("id", round_id)
    .maybeSingle();
  if (!round) return NextResponse.json({ error: "라운드를 찾을 수 없어요" }, { status: 404 });
  if (round.status !== "live") {
    return NextResponse.json({ error: "라운드가 마감되었거나 종료되었어요" }, { status: 400 });
  }

  // Find current top bid
  const { data: top } = await sb
    .from("bids")
    .select("amount")
    .eq("round_id", round_id)
    .eq("cell_id", cell_id)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();
  const topAmount = top?.amount ?? 0;
  if (amt <= topAmount) {
    return NextResponse.json(
      { error: `현재 최고가 ${topAmount.toLocaleString()}원보다 높은 금액을 입력해주세요` },
      { status: 400 }
    );
  }

  const { data, error } = await sb
    .from("bids")
    .insert({ round_id, cell_id, dong, ho, name, amount: amt })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
