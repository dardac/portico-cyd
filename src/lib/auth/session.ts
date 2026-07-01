import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const COOKIE_NAME = "portico_session";

export type ResidentSession = {
  type: "resident";
  apartmentId: string;
  apartmentCode: string;
};

export type AdminSession = {
  type: "admin";
  adminId: string;
  username: string;
};

export type AppSession = ResidentSession | AdminSession;

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET debe tener al menos 32 caracteres en .env.local",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: AppSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<AppSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const session = payload as AppSession;

    if (session.type === "resident" && session.apartmentId && session.apartmentCode) {
      return session;
    }

    if (session.type === "admin" && session.adminId && session.username) {
      return session;
    }

    return null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

async function isSessionStillValid(session: AppSession): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  if (session.type === "resident") {
    const { data } = await supabase
      .from("apartments")
      .select("is_active, registered_at")
      .eq("id", session.apartmentId)
      .maybeSingle();

    return Boolean(data?.is_active && data.registered_at);
  }

  const { data } = await supabase
    .from("admin_users")
    .select("is_active")
    .eq("id", session.adminId)
    .maybeSingle();

  return Boolean(data?.is_active);
}

/** Verifica JWT y que la cuenta siga activa en la base de datos. */
export async function getValidatedSession(): Promise<AppSession | null> {
  const session = await getSession();
  if (!session) return null;
  if (!(await isSessionStillValid(session))) return null;
  return session;
}

export async function setSessionCookie(session: AppSession) {
  const token = await createSessionToken(session);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function getSessionTokenFromRequest(
  request: NextRequest,
): string | undefined {
  return request.cookies.get(COOKIE_NAME)?.value;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
