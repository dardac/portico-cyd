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
