import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { createSession, setSessionCookie, type SessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

interface UserRow {
  username: string;
  nama: string;
  role: string;
  password: string;
  menu_access: string | null;
}

/** Verifikasi token Google reCAPTCHA v3 di sisi server. */
async function verifyRecaptcha(token: string | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // bila secret belum dikonfigurasi, lewati verifikasi
  if (!token) return false;

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    if (!data.success) {
      console.error("[reCAPTCHA] gagal:", JSON.stringify(data));
      return false;
    }
    if (data.action !== "login") {
      console.error("[reCAPTCHA] action mismatch:", data.action);
      return false;
    }
    if ((data.score ?? 0) < 0.5) {
      console.error("[reCAPTCHA] skor terlalu rendah:", data.score);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let username: string, password: string, recaptchaToken: string | null;
  try {
    const body = await request.json();
    username = String(body.username ?? "").trim();
    password = String(body.password ?? "");
    recaptchaToken = body.recaptchaToken ? String(body.recaptchaToken) : null;
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  if (!username || !password) {
    return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
  }

  const recaptchaOk = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaOk) {
    return NextResponse.json(
      { error: "Verifikasi reCAPTCHA gagal. Silakan coba lagi." },
      { status: 403 }
    );
  }

  const user = await queryOne<UserRow>(
    "SELECT username, nama, role, password, menu_access FROM tb_user_admin WHERE username = ? LIMIT 1",
    [username]
  );

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  let menuAccess: string[] = [];
  if (user.menu_access) {
    try {
      const parsed = JSON.parse(user.menu_access);
      if (Array.isArray(parsed)) menuAccess = parsed.map(String);
    } catch {
      menuAccess = [];
    }
  }

  const sessionUser: SessionUser = {
    username: user.username,
    nama: user.nama,
    role: user.role,
    menuAccess,
  };

  // Update login tracking
  await execute(
    "UPDATE tb_user_admin SET login_count = login_count + 1, last_login = NOW() WHERE username = ?",
    [username]
  );

  const token = await createSession(sessionUser);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, token });
}
