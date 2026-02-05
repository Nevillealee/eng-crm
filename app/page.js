import { redirect } from "next/navigation";
import { auth } from "../auth";
import Dashboard from "./components/dashboard";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <Dashboard session={session} />;
}
