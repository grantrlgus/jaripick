import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET → 현재 세션의 admin row 반환 (Authorization: Bearer <token>)
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;
  return NextResponse.json({ admin: auth.admin });
}
