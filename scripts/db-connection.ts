import pg from "pg";

function encodeDatabaseUrl(rawUrl: string): string {
  const match = rawUrl.match(
    /^(postgres(?:ql)?:\/\/)([^:]+):([^@]+)@(.+)$/i,
  );

  if (!match) {
    return rawUrl;
  }

  const [, protocol, user, password, rest] = match;
  const encodedUser = encodeURIComponent(decodeURIComponent(user));
  const encodedPassword = encodeURIComponent(decodeURIComponent(password));

  return `${protocol}${encodedUser}:${encodedPassword}@${rest}`;
}

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "Falta DATABASE_URL en .env.local.\n" +
        "Supabase → Project Settings → Database → Connection string → URI.\n" +
        "Usa el **Session pooler** (host aws-0-*.pooler.supabase.com), no db.*.supabase.co.",
    );
  }

  return encodeDatabaseUrl(databaseUrl);
}

export function createDbClient(): pg.Client {
  return new pg.Client({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
}

export function explainDbError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Error desconocido al conectar con la base de datos.";
  }

  const message = error.message;

  if (message.includes("ENOTFOUND") && message.includes("db.")) {
    return (
      "No se encontró el host db.*.supabase.co.\n" +
      "Copia la URI del **Session pooler** en Supabase → Settings → Database.\n" +
      "Debe verse así: postgresql://postgres.[ref]:[password]@aws-0-....pooler.supabase.com:5432/postgres\n" +
      "Si la contraseña tiene *, @ u otros símbolos, codifícalos (ej. * → %2A)."
    );
  }

  if (message.includes("ENOTFOUND")) {
    return (
      "No se pudo resolver el host de DATABASE_URL. Revisa la URI copiada desde Supabase."
    );
  }

  if (message.includes("password authentication failed")) {
    return "Contraseña de base de datos incorrecta en DATABASE_URL.";
  }

  return message;
}
