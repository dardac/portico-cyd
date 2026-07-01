import { redirect } from "next/navigation";
import { AdminCensusDashboard } from "@/components/census/AdminCensusDashboard";
import { ResidentCensusForm } from "@/components/census/ResidentCensusForm";
import { isStaffSession } from "@/lib/auth/roles";
import { getValidatedSession } from "@/lib/auth/session";

export default async function CensoPage() {
  const session = await getValidatedSession();

  if (!session) {
    redirect("/");
  }

  if (isStaffSession(session)) {
    return <AdminCensusDashboard staffRole={session.role} />;
  }

  return <ResidentCensusForm />;
}
