import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { requireResident } from "@/lib/resident-auth";

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
// Body: { round_id, cell_id, amount, replace? }
// dong/ho/name 은 세션에서 검증된 입주민 정보로 강제 (클라이언트 위조 차단).
export async function POST(req: Request) {
  const body = await req.json();
  const { round_id, cell_id, amount, replace } = body;
  if (!round_id || !cell_id || !amount) {
    return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ error: "금액이 올바르지 않아요" }, { status: 400 });
  }
  const sb = createServiceClient();

  // 라운드의 단지 → 입주민 매칭 (해당 단지 승인된 행만 인정).
  const { data: roundComplex } = await sb
    .from("rounds")
    .select("complex")
    .eq("id", round_id)
    .maybeSingle();
  const auth = await requireResident(req, roundComplex?.complex ?? null);
  if (!auth.ok) return auth.res;
  const { dong, ho, name } = auth.resident;

  // Check round is live AND inside bid window
  const { data: round } = await sb
    .from("rounds")
    .select("status, bid_start, bid_end")
    .eq("id", round_id)
    .maybeSingle();
  if (!round) return NextResponse.json({ error: "라운드를 찾을 수 없어요" }, { status: 404 });
  if (round.status !== "live") {
    return NextResponse.json({ error: "라운드가 마감되었거나 종료되었어요" }, { status: 400 });
  }
  const now = Date.now();
  const startMs = round.bid_start ? new Date(round.bid_start).getTime() : 0;
  const endMs = round.bid_end ? new Date(round.bid_end).getTime() : 0;
  if (startMs && now < startMs) {
    return NextResponse.json({ error: "아직 입찰이 시작되지 않았어요" }, { status: 400 });
  }
  if (endMs && now > endMs) {
    return NextResponse.json({ error: "입찰이 마감되었어요" }, { status: 400 });
  }

  // 세대당 한 구역 원칙: 같은 라운드에 이 세대가 다른 구역에 입찰 중이면 기존 입찰 삭제
  if (replace) {
    await sb
      .from("bids")
      .delete()
      .eq("round_id", round_id)
      .eq("dong", dong)
      .eq("ho", ho)
      .neq("cell_id", cell_id);
  } else {
    const { data: existing } = await sb
      .from("bids")
      .select("cell_id")
      .eq("round_id", round_id)
      .eq("dong", dong)
      .eq("ho", ho)
      .neq("cell_id", cell_id)
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "already_bidding_elsewhere", existing_cell_id: existing[0].cell_id },
        { status: 409 }
      );
    }
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

// DELETE — cancel all of a household's bids on a cell in a live round.
// Body: { round_id, cell_id }
// dong/ho 는 세션에서 검증.
export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { round_id, cell_id } = body || {};
  if (!round_id || !cell_id) {
    return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data: round } = await sb
    .from("rounds")
    .select("status, complex")
    .eq("id", round_id)
    .maybeSingle();
  if (!round) return NextResponse.json({ error: "라운드를 찾을 수 없어요" }, { status: 404 });
  if (round.status !== "live") {
    return NextResponse.json({ error: "진행 중인 라운드만 취소할 수 있어요" }, { status: 400 });
  }
  const auth = await requireResident(req, round.complex);
  if (!auth.ok) return auth.res;
  const { dong, ho } = auth.resident;
  const { error } = await sb
    .from("bids")
    .delete()
    .eq("round_id", round_id)
    .eq("cell_id", cell_id)
    .eq("dong", dong)
    .eq("ho", ho);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
