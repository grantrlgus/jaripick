// Middleware intentionally disabled — admin auth is now handled by Supabase Auth
// via /api/admin/login + Bearer token on API mutations (see lib/admin-auth.ts).
// The previous HTTP Basic auth was replaced with proper role-based auth.
import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
