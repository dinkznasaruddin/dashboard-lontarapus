import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function GET() {
  await destroySession();
  // Redirect relatif — browser menyesuaikan dengan origin halaman sekarang,
  // jadi tidak mengarah ke localhost saat di belakang reverse proxy.
  return NextResponse.redirect("/login");
}