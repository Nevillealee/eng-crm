import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import crypto from "crypto";
import { sendForgotPasswordEmail } from "../../actions/sendEmail";

export async function POST(request) {
  try {
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

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: null, resetPasswordExpires: null },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: expiresAt,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    await sendForgotPasswordEmail({
      to: email,
      name: user.firstName || user.name,
      resetUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password request failed.", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to process forgot password request right now. Please try again later.",
      },
      { status: 500 }
    );
  }
}
