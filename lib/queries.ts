import { createServerClient, isSupabaseConfigured } from "./supabase";
import { MOCK_APARTMENTS } from "./mock-data";
import type { ApartmentWithCount } from "@/types";

// Returns top N apartments ordered by participant count
export async function getPopularApartments(limit = 10): Promise<ApartmentWithCount[]> {
  if (!isSupabaseConfigured()) {
    return [...MOCK_APARTMENTS]
      .sort((a, b) => b.participant_count - a.participant_count)
      .slice(0, limit);
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("apartment_with_counts")
    .select("*")
    .order("participant_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPopularApartments error:", error.message);
    return [];
  }
  return (data ?? []) as ApartmentWithCount[];
}

// Full-text search by apartment name
export async function searchApartments(query: string): Promise<ApartmentWithCount[]> {
  if (!isSupabaseConfigured()) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return getPopularApartments(30);
    return MOCK_APARTMENTS.filter((a) =>
      a.name.toLowerCase().includes(trimmed)
    );
  }

  const supabase = createServerClient();
  const trimmed = query.trim();
  if (!trimmed) return getPopularApartments();

  const { data, error } = await supabase
    .from("apartment_with_counts")
    .select("*")
    .ilike("name", `%${trimmed}%`)
    .order("participant_count", { ascending: false })
    .limit(30);

  if (error) {
    console.error("searchApartments error:", error.message);
    return [];
  }
  return (data ?? []) as ApartmentWithCount[];
}

// Fetch a single apartment with its participant count
export async function getApartmentBySlug(slug: string): Promise<ApartmentWithCount | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_APARTMENTS.find((a) => a.slug === slug) ?? null;
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("apartment_with_counts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("getApartmentBySlug error:", error.message);
    }
    return null;
  }
  return data as ApartmentWithCount;
}

