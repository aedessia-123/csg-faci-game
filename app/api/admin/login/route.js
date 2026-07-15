import { NextResponse } from "next/server";
import { computeAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST(request) {
  const { passcode } = await request.json();

  if (!process.env.ADMIN_PASSCODE || !process.env.ADMIN_AUTH_SECRET) {
    return NextResponse.json({ error: "Admin auth is not configured on the server" }, { status: 500 });
  }
  if (passcode !== process.env.ADMIN_PASSCODE) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const token = await computeAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
