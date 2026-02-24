import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";
import {
  buildVerificationUrl,
  createVerificationTokenRecord,
} from "../../../lib/email-verification";
import { sendVerificationEmail } from "../../actions/sendEmail";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_INVALID_ERROR,
  AVATAR_TOO_LARGE_ERROR,
  AVATAR_TYPE_INVALID_ERROR,
  BASE64_CONTENT_PATTERN,
} from "../../constants/avatar";
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MAX_BYTES_ERROR,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_ERROR,
} from "../../constants/password-policy";

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
    return { error: AVATAR_INVALID_ERROR };
  }

  const normalizedAvatar = avatar.trim();
  if (!normalizedAvatar) {
    return { avatarBuffer: null, avatarMimeType: null };
  }

  if (!BASE64_CONTENT_PATTERN.test(normalizedAvatar)) {
    return { error: AVATAR_INVALID_ERROR };
  }

  if (typeof avatarType !== "string" || !ALLOWED_AVATAR_MIME_TYPES.has(avatarType)) {
    return { error: AVATAR_TYPE_INVALID_ERROR };
  }

  const estimatedBytes = estimateBase64ByteLength(normalizedAvatar);
  if (!estimatedBytes || estimatedBytes > AVATAR_MAX_BYTES) {
    return { error: AVATAR_TOO_LARGE_ERROR };
  }

  const avatarBuffer = Buffer.from(normalizedAvatar, "base64");
  if (!avatarBuffer.length || avatarBuffer.length > AVATAR_MAX_BYTES) {
    return { error: AVATAR_TOO_LARGE_ERROR };
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

    if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: PASSWORD_MIN_LENGTH_ERROR },
        { status: 400 }
      );
    }

    if (Buffer.byteLength(normalizedPassword, "utf8") > PASSWORD_MAX_BYTES) {
      return NextResponse.json(
        { error: PASSWORD_MAX_BYTES_ERROR },
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
