import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/public/config
// Returns JS that sets window.JP_CONFIG with public Supabase values.
// Loaded by the resident PWA (static HTML can't read process.env directly).
// Anon key is safe to expose — RLS enforces access.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const js = `window.JP_CONFIG = ${JSON.stringify({ supabaseUrl: url, supabaseAnonKey: anonKey })};`;
  return new NextResponse(js, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
