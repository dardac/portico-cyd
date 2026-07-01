import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import {
  isValidApartment,
  MAX_PASSWORD_LENGTH,
  normalizeApartmentCode,
} from "@/lib/validators";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(
    `login:${getClientIp(request)}`,
    10,
    60_000,
  );
  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit.retryAfterSec);
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "La base de datos no está configurada. Revisa las variables de entorno.",
      },
      { status: 503 },
    );
  }

  let body: { apartment?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const apartment = normalizeApartmentCode(body.apartment ?? "");
  const password = body.password ?? "";

  if (!apartment || !password) {
    return NextResponse.json(
      { error: "Apartamento y contraseña son obligatorios." },
      { status: 400 },
    );
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: "Apartamento o contraseña incorrectos." },
      { status: 401 },
    );
  }

  if (!isValidApartment(apartment)) {
    return NextResponse.json(
      {
        error:
          "Formato de apartamento inválido. Usa 11-D, NT1-D, PH3-C u otro código válido.",
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();

  const { data: apartmentRow, error } = await supabase
    .from("apartments")
    .select("id, code, password_hash, is_active, registered_at")
    .eq("code", apartment)
    .maybeSingle();

  if (error) {
    console.error("Error al buscar apartamento:", error.message);
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

  if (!apartmentRow || !apartmentRow.is_active) {
    return NextResponse.json(
      { error: "Apartamento o contraseña incorrectos." },
      { status: 401 },
    );
  }

  if (!apartmentRow.registered_at) {
    return NextResponse.json(
      {
        error:
          "Este apartamento aún no está registrado. Completa el registro primero.",
      },
      { status: 403 },
    );
  }

  const passwordMatches = await verifyPassword(
    password,
    apartmentRow.password_hash,
  );

  if (!passwordMatches) {
    return NextResponse.json(
      { error: "Apartamento o contraseña incorrectos." },
      { status: 401 },
    );
  }

  await setSessionCookie({
    type: "resident",
    apartmentId: apartmentRow.id,
    apartmentCode: apartmentRow.code,
  });

  return NextResponse.json({
    success: true,
    apartment: { code: apartmentRow.code },
  });
}
