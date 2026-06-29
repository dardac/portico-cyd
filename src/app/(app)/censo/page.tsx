import { redirect } from "next/navigation";
import { AdminCensusDashboard } from "@/components/census/AdminCensusDashboard";
import { ResidentCensusForm } from "@/components/census/ResidentCensusForm";
import { getSession } from "@/lib/auth/session";

export default async function CensoPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (session.type === "admin") {
    return <AdminCensusDashboard />;
  }

  return <ResidentCensusForm />;
}
