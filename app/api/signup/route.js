import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";
import {
  buildVerificationUrl,
  createVerificationTokenRecord,
} from "../../../lib/email-verification";
import { sendEmail } from "../../actions/sendEmail";

function isPrismaUniqueConstraintError(error) {
  return typeof error === "object" && error !== null && error.code === "P2002";
}

async function issueVerificationEmail(email, name) {
  const { rawToken, tokenHash, expiresAt } = createVerificationTokenRecord();

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: tokenHash,
      expires: expiresAt,
    },
  });

  const verificationUrl = buildVerificationUrl(rawToken);

  await sendEmail({
    type: "verify-email",
    to: email,
    name,
    verificationUrl,
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    avatar,
    avatarType,
  } = body || {};

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!firstName || !lastName || !normalizedEmail || !password || !confirmPassword) {
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

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    if (!existingUser.emailVerified) {
      await issueVerificationEmail(
        normalizedEmail,
        existingUser.firstName || existingUser.name || normalizedEmail
      );
    }
    // Keep responses generic to avoid account enumeration.
    return NextResponse.json({ ok: true });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const avatarBuffer = avatar ? Buffer.from(avatar, "base64") : null;

  let user;
  try {
    user = await prisma.user.create({
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
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      const raceUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { emailVerified: true, firstName: true, name: true },
      });

      if (raceUser && !raceUser.emailVerified) {
        await issueVerificationEmail(
          normalizedEmail,
          raceUser.firstName || raceUser.name || normalizedEmail
        );
      }
      return NextResponse.json({ ok: true });
    }
    throw error;
  }

  await issueVerificationEmail(normalizedEmail, user.firstName || user.name || normalizedEmail);

  return NextResponse.json({ ok: true });
}
