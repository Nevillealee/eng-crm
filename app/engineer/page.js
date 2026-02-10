import { redirect } from "next/navigation";
import { auth } from "../../auth";
import prisma from "../../lib/prisma";
import EngineerAccount from "../components/engineer-account";
import EngineerOnboardingWizard from "../components/engineer-onboarding-wizard";

export default async function EngineerPage() {
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
      onboardingStep: true,
    },
  });

  if (user?.onboardingCompleted) {
    return <EngineerAccount />;
  }

  return <EngineerOnboardingWizard initialStep={user?.onboardingStep || 1} />;
}
