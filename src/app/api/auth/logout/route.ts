import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await destroySession();
  // Redirect ke /login pada origin yang sama (jangan pakai BASE_URL hardcoded
  // yang bisa salah host/port di dev).
  return NextResponse.redirect(new URL("/login", request.url));
}