import bcrypt from "bcryptjs";

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  if (passwordHash.startsWith("$2")) {
    return bcrypt.compare(plainPassword, passwordHash);
  }

  // Hashes generados con pgcrypto crypt() en Supabase (formato bcrypt $2a$)
  return bcrypt.compare(plainPassword, passwordHash);
}
