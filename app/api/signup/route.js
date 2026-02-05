import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../../../lib/prisma";
import { sendEmail } from "../../actions/sendEmail";

export async function POST(request) {
  const body = await request.json();
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    avatar,
    avatarType,
  } = body || {};

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const avatarBuffer = avatar ? Buffer.from(avatar, "base64") : null;

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: normalizedEmail,
      password: passwordHash,
      avatar: avatarBuffer,
      avatarMimeType: avatarType || null,
    },
  });

  const verificationToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token: verificationToken,
      expires: expiresAt,
    },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(verificationToken)}&email=${encodeURIComponent(normalizedEmail)}`;

  await sendEmail({
    type: "verify-email",
    to: normalizedEmail,
    name: user.firstName || user.name,
    verificationUrl,
  });

  return NextResponse.json({ ok: true });
}