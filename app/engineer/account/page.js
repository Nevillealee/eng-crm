import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import prisma from "../../../lib/prisma";
import EngineerAccount from "../../components/engineer-account";

export default async function EngineerAccountPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user?.role === "admin") {
    redirect("/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompleted: true,
    },
  });

  if (!user?.onboardingCompleted) {
    redirect("/engineer");
  }

  return <EngineerAccount />;
}
