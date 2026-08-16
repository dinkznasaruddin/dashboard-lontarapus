import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "lontara_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 jam

export interface SessionUser {
  username: string;
  nama: string;
  role: string;
  menuAccess: string[];
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

/** Sign a session JWT. */
export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE)
    .sign(getSecret());
}

/** Read + verify the session from cookies. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/** Persist session cookie. */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Clear session cookie (logout). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Guard for dashboard pages. Redirects to /login if not authenticated. */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** True if session has access to given menu key (superadmin always). */
export function hasMenuAccess(session: SessionUser | null, menuKey: string): boolean {
  if (!session) return false;
  if (session.role === "superadmin") return true;
  return session.menuAccess.includes(menuKey);
}

export { SESSION_COOKIE };
