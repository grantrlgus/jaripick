"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { SignalType } from "@/types";
import { headers } from "next/headers";

type Result =
  | { success: true; participantCount: number }
  | { error: "already_signaled" | "submission_failed" };

export async function submitInterest(
  apartmentId: string,
  apartmentSlug: string,
  signalType: SignalType
): Promise<Result> {
  const supabase = createServiceClient();

  // Use IP as a loose anonymous identifier (not stored permanently)
  const headersList = headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  // Insert signal — unique constraint on (apartment_id, anon_id) handles duplicates
  const { error: insertError } = await supabase
    .from("apartment_interest_signals")
    .insert({
      apartment_id: apartmentId,
      anon_id: ip,
      signal_type: signalType,
    });

  if (insertError) {
    // Unique constraint violation = already signaled
    if (insertError.code === "23505") {
      return { error: "already_signaled" };
    }
    console.error("submitInterest error:", insertError.message);
    return { error: "submission_failed" };
  }

  // Fetch updated count
  const { count } = await supabase
    .from("apartment_interest_signals")
    .select("*", { count: "exact", head: true })
    .eq("apartment_id", apartmentId);

  revalidatePath(`/apartments/${apartmentSlug}`);
  revalidatePath("/");

  return { success: true, participantCount: count ?? 0 };
}
