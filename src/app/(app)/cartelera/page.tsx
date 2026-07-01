import { redirect } from "next/navigation";
import { SupportBoardList } from "@/components/support-board/SupportBoardList";
import { hasFullAdminAccess, isStaffSession } from "@/lib/auth/roles";
import { getValidatedSession } from "@/lib/auth/session";

export default async function CarteleraPage() {
  const session = await getValidatedSession();

  if (!session) {
    redirect("/");
  }

  const canMarkAttended =
    isStaffSession(session) && hasFullAdminAccess(session);

  return (
    <div className="page-content mx-auto max-w-2xl">
      <SupportBoardList
        canMarkAttended={canMarkAttended}
        defaultApartmentCode={
          session.type === "resident" ? session.apartmentCode : ""
        }
        lockApartment={session.type === "resident"}
      />
    </div>
  );
}
