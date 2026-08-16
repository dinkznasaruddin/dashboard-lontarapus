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

export async function POST(request: NextRequest) {
  let username: string, password: string;
  try {
    const body = await request.json();
    username = String(body.username ?? "").trim();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  if (!username || !password) {
    return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
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
