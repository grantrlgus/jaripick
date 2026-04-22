import { NextRequest, NextResponse } from "next/server";

const REALM = 'Basic realm="JariPick Admin", charset="UTF-8"';

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": REALM },
  });
}

function checkAuth(req: NextRequest): boolean {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (!user || !pass) return false;
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  const decoded = atob(header.slice(6));
  const idx = decoded.indexOf(":");
  if (idx < 0) return false;
  return decoded.slice(0, idx) === user && decoded.slice(idx + 1) === pass;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname === "/ops-9f3k" || pathname.startsWith("/admin/");
  const isMutation =
    pathname.startsWith("/api/cells") && req.method !== "GET" && req.method !== "HEAD";
  if (!isAdminPage && !isMutation) return NextResponse.next();
  if (checkAuth(req)) return NextResponse.next();
  return unauthorized();
}

export const config = {
  matcher: ["/ops-9f3k", "/admin/:path*", "/api/cells", "/api/cells/:path*"],
};
