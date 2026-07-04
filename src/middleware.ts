import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value || null;
  const role = request.cookies.get("userRole")?.value || null; // Read role cookie

  const isAuthenticated = !!token;
  const isSuperAdmin = isAuthenticated && role === "super-admin";

  // Redirect authenticated non-super-admins to /unauthorized if accessing /login or /
  if (isAuthenticated && !isSuperAdmin && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Redirect authenticated super-admins away from login or landing pages
  if (isSuperAdmin && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/super-admin/dashboard", request.url));
  }

  // Protect all /super-admin routes
  if (pathname.startsWith("/super-admin")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}
