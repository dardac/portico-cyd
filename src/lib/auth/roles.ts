/** Roles del personal con acceso al panel (/admin, censo admin). */
export const STAFF_ROLES = ["admin", "vigilante"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type StaffSession = {
  type: "admin";
  adminId: string;
  username: string;
  role: StaffRole;
};

export function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

export function isStaffSession(
  session: { type: string } | null | undefined,
): session is StaffSession {
  return session?.type === "admin";
}

/** Acceso completo al panel (exportar, etc.). Vigilantes: restricciones futuras. */
export function hasFullAdminAccess(session: StaffSession): boolean {
  return session.role === "admin";
}

/** Nombres de ocupantes, ocupación y nombre del contacto de emergencia. */
export function canViewResidentPii(role: StaffRole): boolean {
  return role === "admin";
}

export function getStaffRoleLabel(role: StaffRole): string {
  if (role === "admin") return "Administrador";
  return "Vigilante";
}

/** Rol por defecto con menor privilegio si el JWT trae un valor inválido. */
export function normalizeStaffRole(role: string | undefined): StaffRole {
  if (isStaffRole(role ?? "")) return role as StaffRole;
  return "vigilante";
}
