import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import {
  hasFullAdminAccess,
  isStaffRole,
  isStaffSession,
  type StaffRole,
} from "@/lib/auth/roles";
import { getValidatedSession } from "@/lib/auth/session";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StaffUserSummary = {
  id: string;
  username: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
};

export async function requireFullAdminApiSession() {
  const session = await getValidatedSession();

  if (!session || !isStaffSession(session) || !hasFullAdminAccess(session)) {
    return null;
  }

  return session;
}

export function mapStaffUser(row: {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}): StaffUserSummary {
  return {
    id: row.id,
    username: row.username,
    role: row.role as StaffRole,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function listStaffUsers(): Promise<StaffUserSummary[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, username, role, is_active, created_at")
    .order("username");

  if (error) {
    console.error("Error al listar usuarios:", error.message);
    throw new Error(
      mapSupabaseError(error, "No se pudo cargar la lista de usuarios."),
    );
  }

  return (data ?? [])
    .filter((row) => isStaffRole(row.role))
    .map(mapStaffUser);
}

export function unauthorizedAdminResponse() {
  return NextResponse.json({ error: "No autorizado." }, { status: 403 });
}

export async function hashStaffPassword(password: string) {
  return hashPassword(password);
}

export { isStaffRole };
