import { NextResponse } from "next/server";
import {
  hashStaffPassword,
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
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await requireFullAdminApiSession())) {
    return unauthorizedAdminResponse();
  }

  const rateLimit = checkRateLimit(
    `admin-change-password:${getClientIp(request)}`,
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

  const { id } = await context.params;

  let body: { password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const password = body.password ?? "";

  if (!password) {
    return NextResponse.json(
      { error: "La contraseña es obligatoria." },
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

  const { data: updated, error } = await supabase
    .from("admin_users")
    .update({ password_hash: passwordHash })
    .eq("id", id)
    .eq("is_active", true)
    .select("id, username")
    .maybeSingle();

  if (error) {
    console.error("Error al cambiar contraseña:", error.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(error, "No se pudo cambiar la contraseña."),
      },
      { status: 500 },
    );
  }

  if (!updated) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    username: updated.username,
  });
}
