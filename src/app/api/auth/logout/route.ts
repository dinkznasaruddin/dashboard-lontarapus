import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await destroySession();
  // Bangun origin dari header forwarded (nginx) agar tidak terpaku pada
  // localhost/internal host. Fallback ke Host header / nextUrl.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = forwardedHost || request.headers.get("host") || request.nextUrl.host;
  const proto = forwardedProto ? forwardedProto.split(",")[0].trim() : request.nextUrl.protocol.replace(":", "");
  const origin = `${proto}://${host}`;
  return NextResponse.redirect(new URL("/login", origin));
}