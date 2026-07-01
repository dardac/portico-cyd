import { NextResponse } from "next/server";
import {
  hashStaffPassword,
  isStaffRole,
  listStaffUsers,
  requireFullAdminApiSession,
  unauthorizedAdminResponse,
} from "@/lib/auth/admin-users-api";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { mapSupabaseError } from "@/lib/supabase/errors";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  exceedsMaxLength,
  isValidStaffUsername,
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  sanitizeStaffUsernameInput,
} from "@/lib/validators";

export async function GET() {
  if (!(await requireFullAdminApiSession())) {
    return unauthorizedAdminResponse();
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "La base de datos no está configurada." },
      { status: 503 },
    );
  }

  try {
    const users = await listStaffUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar la lista de usuarios.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await requireFullAdminApiSession())) {
    return unauthorizedAdminResponse();
  }

  const rateLimit = checkRateLimit(
    `admin-create-user:${getClientIp(request)}`,
    20,
    60_000,
  );
  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfterSec);
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "La base de datos no está configurada." },
      { status: 503 },
    );
  }

  let body: { role?: string; username?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const role = body.role?.trim() ?? "";
  const username = sanitizeStaffUsernameInput(body.username?.trim() ?? "");
  const password = body.password ?? "";

  if (!role || !username || !password) {
    return NextResponse.json(
      { error: "Rol, usuario y contraseña son obligatorios." },
      { status: 400 },
    );
  }

  if (!isStaffRole(role)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  }

  if (
    !isValidStaffUsername(username) ||
    exceedsMaxLength(username, MAX_USERNAME_LENGTH)
  ) {
    return NextResponse.json(
      {
        error:
          "Usuario inválido. Sin espacios; usa 3–50 caracteres: letras minúsculas, números, punto, guión o guión bajo.",
      },
      { status: 400 },
    );
  }

  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return NextResponse.json(
      {
        error: `La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.`,
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();
  const passwordHash = await hashStaffPassword(password);

  const { data: created, error } = await supabase
    .from("admin_users")
    .insert({
      username,
      password_hash: passwordHash,
      role,
      is_active: true,
    })
    .select("id, username, role, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ese nombre de usuario ya está en uso." },
        { status: 409 },
      );
    }

    console.error("Error al crear usuario:", error.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(error, "No se pudo crear el usuario."),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: created.id,
      username: created.username,
      role: created.role,
      createdAt: created.created_at,
    },
  });
}
