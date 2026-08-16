import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/** Detail aduan untuk satu kategori atau layanan (dari DB, query per-baris). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "";
  const name = url.searchParams.get("name") || "";
  if (!name || (type !== "kategori" && type !== "opd")) {
    return NextResponse.json({ error: "parameter type/name tidak valid" }, { status: 400 });
  }

  const limit = Math.min(Number(url.searchParams.get("limit") || "500"), 2000);
  let sql: string;
  let params: string[];
  if (type === "kategori") {
    const aliases =
      name === "Lampu Jalan"
        ? ["Lampu Jalan", "PJU"]
        : name === "Layanan PDAM"
          ? ["Layanan PDAM", "Pipa PDAM Bocor"]
          : [name];
    const placeholders = aliases.map(() => "?").join(", ");
    sql = `SELECT ticketid, kategori, status, kelurahan, Layanan, nama_pelapor,
                  durasi_replies_first_last, waktu_aduan
           FROM tb_aduansync
           WHERE kategori IN (${placeholders})
           ORDER BY waktu_aduan DESC
           LIMIT ${Number(limit)}`;
    params = aliases;
  } else {
    sql = `SELECT ticketid, kategori, status, kelurahan, Layanan, nama_pelapor,
                  durasi_replies_first_last, waktu_aduan
           FROM tb_aduansync
           WHERE Layanan = ?
           ORDER BY waktu_aduan DESC
           LIMIT ${Number(limit)}`;
    params = [name];
  }

  try {
    const [rows] = await pool.query(sql, params);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}