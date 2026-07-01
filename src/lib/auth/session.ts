import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  isStaffRole,
  normalizeStaffRole,
  type StaffRole,
  type StaffSession,
} from "@/lib/auth/roles";
import { withAppSession } from "@/lib/db/app-session";

const COOKIE_NAME = "portico_session";

/** Usuario regular (residente del edificio). */
export type ResidentSession = {
  type: "resident";
  apartmentId: string;
  apartmentCode: string;
};

export type AdminSession = StaffSession;

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

function normalizeAdminPayload(
  payload: Record<string, unknown>,
): AdminSession | null {
  const adminId = payload.adminId;
  const username = payload.username;

  if (typeof adminId !== "string" || typeof username !== "string") {
    return null;
  }

  return {
    type: "admin",
    adminId,
    username,
    role: normalizeStaffRole(
      typeof payload.role === "string" ? payload.role : undefined,
    ),
  };
}

export async function verifySessionToken(
  token: string,
): Promise<AppSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      payload.type === "resident" &&
      typeof payload.apartmentId === "string" &&
      typeof payload.apartmentCode === "string"
    ) {
      return {
        type: "resident",
        apartmentId: payload.apartmentId,
        apartmentCode: payload.apartmentCode,
      };
    }

    if (payload.type === "admin") {
      return normalizeAdminPayload(payload as Record<string, unknown>);
    }

    return null;
  } catch {
    return null;
  }
}

/** Verifica JWT y que la cuenta siga activa en la base de datos (respeta RLS). */
export async function validateSessionToken(
  token: string,
): Promise<AppSession | null> {
  const session = await verifySessionToken(token);
  if (!session) return null;

  if (session.type === "resident") {
    const isValid = await withAppSession(session, async (query) => {
      const result = await query<{
        is_active: boolean;
        registered_at: string | null;
      }>(
        `select is_active, registered_at
         from apartments
         where id = $1`,
        [session.apartmentId],
      );

      const row = result.rows[0];
      return Boolean(row?.is_active && row?.registered_at);
    });

    return isValid ? session : null;
  }

  return withAppSession(session, async (query) => {
    const result = await query<{
      is_active: boolean;
      role: string;
    }>(
      `select is_active, role
       from admin_users
       where id = $1`,
      [session.adminId],
    );

    const data = result.rows[0];
    if (!data?.is_active || !isStaffRole(data.role)) {
      return null;
    }

    return {
      ...session,
      role: data.role,
    };
  });
}

export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Verifica JWT y que la cuenta siga activa en la base de datos. */
export async function getValidatedSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return validateSessionToken(token);
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

export type { StaffRole };
