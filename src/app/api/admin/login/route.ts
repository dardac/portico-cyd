import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
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
import { MAX_PASSWORD_LENGTH } from "@/lib/validators";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(
    `admin-login:${getClientIp(request)}`,
    10,
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

  let body: { username?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Usuario y contraseña son obligatorios." },
      { status: 400 },
    );
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos." },
      { status: 401 },
    );
  }

  const supabase = createSupabaseServerClient();

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("id, username, password_hash, is_active, role")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("Error al buscar admin:", error.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(
          error,
          "No se pudo verificar el acceso. Intenta de nuevo.",
        ),
      },
      { status: 500 },
    );
  }

  if (!admin || !admin.is_active || !isStaffRole(admin.role)) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos." },
      { status: 401 },
    );
  }

  const passwordMatches = await verifyPassword(password, admin.password_hash);

  if (!passwordMatches) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos." },
      { status: 401 },
    );
  }

  await setSessionCookie({
    type: "admin",
    adminId: admin.id,
    username: admin.username,
    role: admin.role,
  });

  return NextResponse.json({ success: true, role: admin.role });
}
