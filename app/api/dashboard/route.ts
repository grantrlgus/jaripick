import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DEFAULT_COMPLEX = "heliocity";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const complex = searchParams.get("complex") || DEFAULT_COMPLEX;
  const sb = createServiceClient();

  const [cellsRes, pendingRes, approvedRes, liveRoundRes, configRes] = await Promise.all([
    sb.from("parking_cells").select("id, active, type"),
    sb.from("resident_requests").select("id", { count: "exact", head: true }).eq("complex", complex).eq("status", "pending"),
    sb.from("resident_requests").select("id", { count: "exact", head: true }).eq("complex", complex).eq("status", "approved"),
    sb.from("rounds").select("*").eq("complex", complex).eq("status", "live").order("bid_start", { ascending: false }).limit(1).maybeSingle(),
    sb.from("complex_config").select("*").eq("complex", complex).maybeSingle(),
  ]);

  const cells = cellsRes.data || [];
  const activeBidCells = cells.filter((c) => c.active !== false && c.type !== "excluded").length;

  let liveRoundStats: {
    id: string;
    name: string;
    bid_end: string;
    days_left: number;
    participants: number;
    bid_count: number;
  } | null = null;

  if (liveRoundRes.data) {
    const round = liveRoundRes.data;
    const { data: bids } = await sb.from("bids").select("dong, ho").eq("round_id", round.id);
    const uniqParticipants = new Set((bids || []).map((b) => `${b.dong}-${b.ho}`));
    const end = new Date(round.bid_end).getTime();
    const now = Date.now();
    const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    liveRoundStats = {
      id: round.id,
      name: round.name,
      bid_end: round.bid_end,
      days_left: daysLeft,
      participants: uniqParticipants.size,
      bid_count: bids?.length || 0,
    };
  }

  return NextResponse.json({
    complex: configRes.data || { complex, name: null, address: null, total_units: null },
    cells: {
      total: cells.length,
      active_bid_cells: activeBidCells,
    },
    residents: {
      pending: pendingRes.count || 0,
      approved: approvedRes.count || 0,
    },
    live_round: liveRoundStats,
  });
}
