import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";
import {
  buildVerificationUrl,
  createVerificationTokenRecord,
} from "../../../lib/email-verification";
import { sendVerificationEmail } from "../../actions/sendEmail";
import {
  AVATAR_INVALID_ERROR,
  AVATAR_URL_MAX_LENGTH,
  AVATAR_URL_TOO_LONG_ERROR,
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

function parseSignupAvatar(avatar) {
  if (avatar === undefined || avatar === null) {
    return { avatarUrl: null };
  }

  if (typeof avatar !== "string") {
    return { error: AVATAR_INVALID_ERROR };
  }

  const trimmedAvatar = avatar.trim();
  if (!trimmedAvatar) {
    return { avatarUrl: null };
  }

  if (trimmedAvatar.length > AVATAR_URL_MAX_LENGTH) {
    return { error: AVATAR_URL_TOO_LONG_ERROR };
  }

  let parsedAvatarUrl;
  try {
    parsedAvatarUrl = new URL(trimmedAvatar);
  } catch {
    return { error: AVATAR_INVALID_ERROR };
  }

  if (parsedAvatarUrl.protocol !== "https:" && parsedAvatarUrl.protocol !== "http:") {
    return { error: AVATAR_INVALID_ERROR };
  }

  if (parsedAvatarUrl.protocol === "http:") {
    parsedAvatarUrl.protocol = "https:";
  }

  return { avatarUrl: parsedAvatarUrl.toString() };
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
    const avatarPayload = parseSignupAvatar(avatar);
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
          image: avatarPayload.avatarUrl,
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
