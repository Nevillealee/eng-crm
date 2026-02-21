import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import crypto from "crypto";
import { sendForgotPasswordEmail } from "../../actions/sendEmail";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Email is required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // To prevent email enumeration, always return success even if user not found
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Invalidate any existing token before issuing a new one.
  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: null, resetPasswordExpires: null },
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  // Only the raw token travels in the URL — the server resolves the user by hashing it.
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  await sendForgotPasswordEmail({
    to: email,
    name: user.firstName || user.name,
    resetUrl,
  });

  return NextResponse.json({ ok: true });
}
