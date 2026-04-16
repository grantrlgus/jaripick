import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return !!url && !!anonKey;
}

// Public read client — safe to use in server components
export function createServerClient() {
  if (!url || !anonKey) throw new Error("Supabase env vars not set");
  return createClient<Database>(url, anonKey);
}

// Service role client — for server actions / mutations only.
// NEVER expose this key to the browser.
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase env vars not set");
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
