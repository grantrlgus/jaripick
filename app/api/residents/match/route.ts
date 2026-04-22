import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

// Input: { complex?, dong, ho, name } → if matches approved household, auto-approve.
export async function POST(req: Request) {
  const body = await req.json();
  const complex = body.complex || DEFAULT_COMPLEX;
  const dong = String(body.dong || "").trim();
  const ho = String(body.ho || "").trim();
  const name = String(body.name || "").trim();
  if (!dong || !ho || !name) {
    return NextResponse.json({ status: "invalid", reason: "동/호/이름 모두 입력해주세요" }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("households")
    .select("*")
    .eq("complex", complex)
    .eq("dong", dong)
    .eq("ho", ho)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) {
    return NextResponse.json({ status: "not_found", reason: "명단에 없는 동·호예요" });
  }
  if (data.name !== name) {
    return NextResponse.json({ status: "name_mismatch", reason: "명단 실명과 일치하지 않아요" });
  }
  return NextResponse.json({
    status: "approved",
    household: { dong: data.dong, ho: data.ho, name: data.name },
  });
}
