import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";

const INVALID_TOKEN_RESPONSE = NextResponse.json(
  { ok: false, error: "Invalid or expired reset token." },
  { status: 400 }
);

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || !password) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  // Prevent bcrypt DoS — bcrypt silently truncates at 72 bytes; we cap at 32.
  if (Buffer.byteLength(password, "utf8") > 32) {
    return NextResponse.json(
      { ok: false, error: "Password must be 32 characters or fewer." },
      { status: 400 }
    );
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Resolve the user by the hashed token alone — no email parameter needed or trusted.
  const user = await prisma.user.findFirst({
    where: { resetPasswordToken: tokenHash },
  });

  if (!user || !user.resetPasswordExpires) {
    return INVALID_TOKEN_RESPONSE;
  }

  if (user.resetPasswordExpires < new Date()) {
    return INVALID_TOKEN_RESPONSE;
  }

  // Timing-safe comparison to prevent oracle attacks.
  const storedBuf = Buffer.from(user.resetPasswordToken, "hex");
  const incomingBuf = Buffer.from(tokenHash, "hex");
  if (
    storedBuf.length !== incomingBuf.length ||
    !crypto.timingSafeEqual(storedBuf, incomingBuf)
  ) {
    return INVALID_TOKEN_RESPONSE;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return NextResponse.json({ ok: true });
}
