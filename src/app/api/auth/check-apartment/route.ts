import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import {
  isValidApartment,
  normalizeApartmentCode,
} from "@/lib/validators";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { mapSupabaseError } from "@/lib/supabase/errors";

const REGISTRATION_BLOCKED_MESSAGE =
  "No es posible registrar este apartamento. Verifica el código o inicia sesión si ya tienes cuenta.";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(
    `check-apartment:${getClientIp(request)}`,
    20,
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

  let body: { apartment?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const apartment = normalizeApartmentCode(body.apartment ?? "");

  if (!apartment) {
    return NextResponse.json(
      { error: "Ingresa el número de apartamento." },
      { status: 400 },
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
    .select("id, code, registered_at, is_active")
    .eq("code", apartment)
    .maybeSingle();

  if (error) {
    console.error("Error al verificar apartamento:", error.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(
          error,
          "No se pudo verificar el apartamento. Intenta de nuevo.",
        ),
      },
      { status: 500 },
    );
  }

  if (
    !apartmentRow ||
    !apartmentRow.is_active ||
    apartmentRow.registered_at
  ) {
    return NextResponse.json(
      { error: REGISTRATION_BLOCKED_MESSAGE },
      { status: 400 },
    );
  }

  return NextResponse.json({
    available: true,
    apartment: { code: apartmentRow.code },
  });
}
