import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const complex = searchParams.get("complex") || DEFAULT_COMPLEX;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("complex_config")
    .select("*")
    .eq("complex", complex)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || { complex });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const complex = body.complex || DEFAULT_COMPLEX;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of ["name", "address", "total_units", "min_bid", "bid_rule", "payment_mode"] as const) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  const sb = createServiceClient();
  const { error } = await sb
    .from("complex_config")
    .upsert({ complex, ...patch }, { onConflict: "complex" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
