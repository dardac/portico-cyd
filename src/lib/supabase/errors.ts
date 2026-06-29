export function mapSupabaseError(
  error: { message: string; code?: string },
  fallback: string,
): string {
  const message = error.message.toLowerCase();

  if (message.includes("registered_at") && message.includes("does not exist")) {
    return "La base de datos necesita actualizarse. Ejecuta: npm run db:migrate";
  }

  if (message.includes("permission denied")) {
    return "Error de permisos en la base de datos. Ejecuta: npm run db:migrate (migración 003_api_grants).";
  }

  return fallback;
}
