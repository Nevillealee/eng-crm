import { redirect } from "next/navigation";
import { auth } from "../../auth";
import AdminDashboard from "../components/admin-dashboard";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user?.role !== "admin") {
    redirect("/engineer");
  }

  return <AdminDashboard session={session} />;
}
