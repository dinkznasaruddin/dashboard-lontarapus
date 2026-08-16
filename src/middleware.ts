import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/cuaca"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isLanding = pathname === "/";

  // Verifikasi token — cookie basi/expired dianggap BELUM login agar tidak
  // terjadi redirect loop antara /login dan /dashboard.
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const response = NextResponse.next();

  // Cookie invalid/expired -> buang supaya status login konsisten
  if (token && !session) {
    response.cookies.delete(SESSION_COOKIE);
  }

  const isLoggedIn = session !== null;

  // Belum login, akses halaman non-public -> redirect ke login
  if (!isLoggedIn && !isPublic && !isLanding) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Sudah login, akses halaman depan / login -> arahkan ke dashboard
  if (isLoggedIn && (isLanding || pathname === "/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|img|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};