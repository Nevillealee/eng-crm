import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.json(
      { ok: false, error: "Missing token or email." },
      { status: 400 }
    );
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.identifier !== email) {
    return NextResponse.json(
      { ok: false, error: "Invalid verification link." },
      { status: 400 }
    );
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => { });
    return NextResponse.json(
      { ok: false, error: "Verification link expired." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}
