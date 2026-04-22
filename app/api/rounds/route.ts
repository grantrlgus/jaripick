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
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("rounds")
    .insert({ complex, name, bid_start, bid_end, contract_start, contract_end, status: "live" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
