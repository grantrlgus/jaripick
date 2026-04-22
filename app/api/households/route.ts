import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const complex = url.searchParams.get("complex") || DEFAULT_COMPLEX;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("households")
    .select("*")
    .eq("complex", complex)
    .order("dong")
    .order("ho");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// Bulk replace: { complex, rows: [{ dong, ho, name, phone?, status? }] }
export async function PUT(req: Request) {
  const body = await req.json();
  const complex = body.complex || DEFAULT_COMPLEX;
  const rows = Array.isArray(body.rows) ? body.rows : null;
  if (!rows) return NextResponse.json({ error: "rows required" }, { status: 400 });
  const sb = createServiceClient();
  const { error: delErr } = await sb.from("households").delete().eq("complex", complex);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  if (rows.length > 0) {
    const insert = rows.map((r: any) => ({
      complex,
      dong: String(r.dong),
      ho: String(r.ho),
      name: String(r.name),
      phone: r.phone ? String(r.phone) : null,
      status: r.status === "pending" ? "pending" : "approved",
    }));
    const { error } = await sb.from("households").insert(insert);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: rows.length });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.dong || !body.ho || !body.name) {
    return NextResponse.json({ error: "dong, ho, name required" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("households")
    .insert({
      complex: body.complex || DEFAULT_COMPLEX,
      dong: String(body.dong),
      ho: String(body.ho),
      name: String(body.name),
      phone: body.phone ? String(body.phone) : null,
      status: body.status === "pending" ? "pending" : "approved",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const sb = createServiceClient();
  const { error } = await sb.from("households").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
