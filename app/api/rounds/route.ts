import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

// GET ?complex=&status=live|closed|finalized|all
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const complex = searchParams.get("complex") || DEFAULT_COMPLEX;
  const status = searchParams.get("status") || "all";
  const sb = createServiceClient();
  let q = sb
    .from("rounds")
    .select("*")
    .eq("complex", complex)
    .order("bid_start", { ascending: false });
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST create new round (sets status=live)
export async function POST(req: Request) {
  const body = await req.json();
  const complex = body.complex || DEFAULT_COMPLEX;
  const name = String(body.name || "").trim();
  const bid_start = body.bid_start;
  const bid_end = body.bid_end;
  const contract_start = body.contract_start;
  const contract_end = body.contract_end;
  if (!name || !bid_start || !bid_end || !contract_start || !contract_end) {
    return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
  }
  if (new Date(bid_end).getTime() <= new Date(bid_start).getTime()) {
    return NextResponse.json({ error: "입찰 종료는 시작보다 이후여야 해요" }, { status: 400 });
  }
  if (new Date(contract_end).getTime() <= new Date(contract_start).getTime()) {
    return NextResponse.json({ error: "계약 종료는 시작보다 이후여야 해요" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data: existingLive } = await sb
    .from("rounds")
    .select("id")
    .eq("complex", complex)
    .eq("status", "live")
    .limit(1);
  if (existingLive && existingLive.length > 0) {
    return NextResponse.json({ error: "이미 진행 중인 라운드가 있어요. 먼저 마감해주세요." }, { status: 409 });
  }
  // 계약기간 겹침 차단: live/finalized 라운드와 contract 구간 겹치면 409
  const { data: overlapping } = await sb
    .from("rounds")
    .select("id, name, contract_start, contract_end, status")
    .eq("complex", complex)
    .in("status", ["live", "finalized"])
    .lte("contract_start", contract_end)
    .gte("contract_end", contract_start);
  if (overlapping && overlapping.length > 0) {
    const o = overlapping[0];
    return NextResponse.json(
      { error: `계약기간이 기존 라운드(${o.name}, ${o.contract_start}~${o.contract_end})와 겹쳐요` },
      { status: 409 }
    );
  }
  const { data, error } = await sb
    .from("rounds")
    .insert({ complex, name, bid_start, bid_end, contract_start, contract_end, status: "live" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
