import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { mapSupabaseError } from "@/lib/supabase/errors";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  const supabase = createSupabaseServerClient();

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("id, username, password_hash, is_active")
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

  if (!admin || !admin.is_active) {
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
  });

  return NextResponse.json({ success: true });
}
