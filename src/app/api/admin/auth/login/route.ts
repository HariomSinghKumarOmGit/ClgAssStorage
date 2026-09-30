import { NextResponse } from "next/server";
import {
  validateAdminCredentials,
  signAdminToken,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminId, password } = body as { adminId?: string; password?: string };

    if (!adminId || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    if (!validateAdminCredentials(adminId, password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signAdminToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[Admin Login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
