import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    adminId: process.env.ADMIN_ID,
    adminPassword: process.env.ADMIN_PASSWORD,
    adminJwtSecret: process.env.ADMIN_JWT_SECRET,
  });
}
