/**
 * Admin authentication — separate from NextAuth user sessions.
 * Uses a signed JWT stored in an HTTP-only cookie.
 * Credentials come ONLY from server-side env vars — never client code.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(): Promise<string> {
  return await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

/**
 * Server-side: check if the current request has a valid admin session cookie.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return await verifyAdminToken(token);
  } catch {
    return false;
  }
}

/**
 * Validate admin credentials against env vars.
 * Returns true if valid, false otherwise.
 */
export function validateAdminCredentials(id: string, password: string): boolean {
  const envId = process.env.ADMIN_ID;
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envId || !envPassword) return false;
  return id === envId && password === envPassword;
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
