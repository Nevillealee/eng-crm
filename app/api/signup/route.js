import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";
import {
  buildVerificationUrl,
  createVerificationTokenRecord,
} from "../../../lib/email-verification";
import { sendVerificationEmail } from "../../actions/sendEmail";

const allowedAvatarMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxAvatarBytes = 2 * 1024 * 1024;
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

function isPrismaUniqueConstraintError(error) {
  return typeof error === "object" && error !== null && error.code === "P2002";
}

function estimateBase64ByteLength(value) {
  if (value.length % 4 !== 0) {
    return null;
  }

  const paddingLength = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return (value.length / 4) * 3 - paddingLength;
}

function parseSignupAvatar(avatar, avatarType) {
  if (avatar === undefined || avatar === null) {
    return { avatarBuffer: null, avatarMimeType: null };
  }

  if (typeof avatar !== "string") {
    return { error: "Avatar image is invalid." };
  }

  const normalizedAvatar = avatar.trim();
  if (!normalizedAvatar) {
    return { avatarBuffer: null, avatarMimeType: null };
  }

  if (!base64Pattern.test(normalizedAvatar)) {
    return { error: "Avatar image is invalid." };
  }

  if (typeof avatarType !== "string" || !allowedAvatarMimeTypes.has(avatarType)) {
    return { error: "Avatar type is invalid." };
  }

  const estimatedBytes = estimateBase64ByteLength(normalizedAvatar);
  if (!estimatedBytes || estimatedBytes > maxAvatarBytes) {
    return { error: "Avatar must be 2MB or smaller." };
  }

  const avatarBuffer = Buffer.from(normalizedAvatar, "base64");
  if (!avatarBuffer.length || avatarBuffer.length > maxAvatarBytes) {
    return { error: "Avatar must be 2MB or smaller." };
  }

  return { avatarBuffer, avatarMimeType: avatarType };
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

  await sendVerificationEmail({
    to: email,
    name,
    verificationUrl,
  });
}

export async function POST(request) {
  try {
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

    const normalizedFirstName = typeof firstName === "string" ? firstName.trim() : "";
    const normalizedLastName = typeof lastName === "string" ? lastName.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPassword = typeof password === "string" ? password : "";
    const normalizedConfirmPassword = typeof confirmPassword === "string" ? confirmPassword : "";

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedEmail ||
      !normalizedPassword ||
      !normalizedConfirmPassword
    ) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (normalizedPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (Buffer.byteLength(normalizedPassword, "utf8") > 32) {
      return NextResponse.json(
        { error: "Password must be 32 characters or fewer." },
        { status: 400 }
      );
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
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
      return NextResponse.json({ ok: true });
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 12);
    const avatarPayload = parseSignupAvatar(avatar, avatarType);
    if (avatarPayload.error) {
      return NextResponse.json(
        { error: avatarPayload.error },
        { status: 400 }
      );
    }

    let user;
    try {
      user = await prisma.user.create({
        data: {
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          name: `${normalizedFirstName} ${normalizedLastName}`.trim(),
          email: normalizedEmail,
          password: passwordHash,
          avatar: avatarPayload.avatarBuffer,
          avatarMimeType: avatarPayload.avatarMimeType,
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
  } catch (error) {
    console.error("Signup failed.", error);
    return NextResponse.json(
      { error: "Sign-up is temporarily unavailable. Please try again in a few minutes." },
      { status: 500 }
    );
  }
}
