import { redirect } from "next/navigation";
import { StaffUsersList } from "@/components/admin/StaffUsersList";
import {
  listStaffUsers,
  type StaffUserSummary,
} from "@/lib/auth/admin-users-api";
import { hasFullAdminAccess, isStaffSession } from "@/lib/auth/roles";
import { getValidatedSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function UsuariosPage() {
  const session = await getValidatedSession();

  if (!session) {
    redirect("/");
  }

  if (!isStaffSession(session) || !hasFullAdminAccess(session)) {
    redirect("/registro");
  }

  let users: StaffUserSummary[] = [];
  let loadError: string | null = null;

  if (!isSupabaseConfigured()) {
    loadError = "La base de datos no está configurada.";
  } else {
    try {
      users = await listStaffUsers();
    } catch (error) {
      loadError =
        error instanceof Error
          ? error.message
          : "No se pudo cargar la lista de usuarios.";
    }
  }

  return (
    <div className="page-content mx-auto max-w-2xl">
      {loadError ? <div className="alert-error mb-6">{loadError}</div> : null}
      <StaffUsersList users={users} />
    </div>
  );
}
