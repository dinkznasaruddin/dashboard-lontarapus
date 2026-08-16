import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function GET() {
  await destroySession();
  const url = new URL("/login", process.env.BASE_URL || "http://localhost:3000");
  return NextResponse.redirect(url);
}