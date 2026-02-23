import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { hashVerificationToken } from "../../../lib/email-verification";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing token." },
        { status: 400 }
      );
    }

    const tokenHash = hashVerificationToken(token);
    const record =
      (await prisma.verificationToken.findUnique({
        where: { token: tokenHash },
      })) ||
      (await prisma.verificationToken.findUnique({
        where: { token },
      }));

    if (!record) {
      return NextResponse.json(
        { ok: false, error: "Invalid verification link." },
        { status: 400 }
      );
    }

    if (email && record.identifier !== email) {
      return NextResponse.json(
        { ok: false, error: "Invalid verification link." },
        { status: 400 }
      );
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token: record.token } }).catch(() => {});
      return NextResponse.json(
        { ok: false, error: "Verification link expired." },
        { status: 400 }
      );
    }

    const updateResult = await prisma.user.updateMany({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token: record.token } }).catch(() => {});

    if (updateResult.count === 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid verification link." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Email verification failed.", error);
    return NextResponse.json(
      { ok: false, error: "Unable to verify email right now. Please try again later." },
      { status: 500 }
    );
  }
}
