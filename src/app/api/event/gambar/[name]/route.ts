import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "dashboard", "event");

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  // Cegah path traversal: hanya izinkan nama file biasa.
  if (!/^[\w.-]+$/.test(name)) return new NextResponse("Not Found", { status: 404 });

  const filePath = path.join(UPLOAD_DIR, name);
  try {
    const buf = await readFile(filePath);
    const ext = name.split(".").pop()?.toLowerCase() || "jpg";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}