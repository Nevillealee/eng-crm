import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import {
  buildVerificationUrl,
  createVerificationTokenRecord,
} from "../../../lib/email-verification";
import { sendVerificationEmail } from "../../actions/sendEmail";

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

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  await issueVerificationEmail(email, user.firstName || user.name || email);

  return NextResponse.json({ ok: true });
}
