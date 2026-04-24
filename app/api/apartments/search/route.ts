import { NextResponse } from "next/server";
import { searchApartments } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Public search endpoint for resident app's complex-register screen.
// GET /api/apartments/search?q=오금
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json([]);
  const results = await searchApartments(q);
  // Trim payload to only what the UI needs.
  const trimmed = results.slice(0, 20).map((a) => ({
    slug: a.slug,
    name: a.name,
    address: a.address,
    district: a.district,
    city: a.city,
  }));
  return NextResponse.json(trimmed);
}
