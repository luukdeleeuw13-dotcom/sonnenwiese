import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Eenvoudige sessie voor de admin-pagina: na inloggen met het wachtwoord
// (env var ADMIN_PASSWORD) krijgt de browser een httpOnly-cookie waarvan de
// waarde alleen server-side te berekenen is.

export const ADMIN_COOKIE = "sw_admin";

function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt");
  return key;
}

export function sessionToken(): string {
  return createHmac("sha256", secret())
    .update("admin-session-v1")
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function isPasswordCorrect(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  return Boolean(value && safeEqual(value, sessionToken()));
}
