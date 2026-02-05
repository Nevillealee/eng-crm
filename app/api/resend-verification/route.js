import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "../../../lib/prisma";
import { sendEmail } from "../../actions/sendEmail";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.toLowerCase() : "";

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Email is required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const verificationToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: verificationToken,
      expires: expiresAt,
    },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(verificationToken)}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    type: "verify-email",
    to: email,
    name: user.firstName || user.name,
    verificationUrl,
  });

  return NextResponse.json({ ok: true });
}
