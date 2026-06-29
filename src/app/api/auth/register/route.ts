import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import {
  isValidApartment,
  isValidEmail,
  isValidPhone,
  normalizeApartmentCode,
} from "@/lib/validators";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { mapSupabaseError } from "@/lib/supabase/errors";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "La base de datos no está configurada. Revisa las variables de entorno.",
      },
      { status: 503 },
    );
  }

  let body: {
    apartment?: string;
    email?: string;
    phone?: string;
    password?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const apartment = normalizeApartmentCode(body.apartment ?? "");
  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone?.trim() ?? "";
  const password = body.password ?? "";

  if (!apartment || !email || !phone || !password) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios." },
      { status: 400 },
    );
  }

  if (!isValidApartment(apartment)) {
    return NextResponse.json(
      { error: "Formato de apartamento inválido." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Ingresa un correo electrónico válido." },
      { status: 400 },
    );
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Ingresa un número de teléfono válido (mínimo 10 dígitos)." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();

  const { data: apartmentRow, error: fetchError } = await supabase
    .from("apartments")
    .select("id, code, registered_at, is_active")
    .eq("code", apartment)
    .maybeSingle();

  if (fetchError) {
    console.error("Error al buscar apartamento:", fetchError.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(
          fetchError,
          "No se pudo completar el registro. Intenta de nuevo.",
        ),
      },
      { status: 500 },
    );
  }

  if (!apartmentRow) {
    return NextResponse.json(
      { error: "Este apartamento no existe en el edificio." },
      { status: 404 },
    );
  }

  if (!apartmentRow.is_active) {
    return NextResponse.json(
      { error: "Este apartamento no está habilitado para registro." },
      { status: 403 },
    );
  }

  if (apartmentRow.registered_at) {
    return NextResponse.json(
      { error: "Este apartamento ya está registrado." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  const { error: updateError } = await supabase
    .from("apartments")
    .update({
      email,
      phone,
      password_hash: passwordHash,
      registered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", apartmentRow.id)
    .is("registered_at", null);

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json(
        { error: "Este correo ya está registrado en otro apartamento." },
        { status: 409 },
      );
    }

    console.error("Error al registrar apartamento:", updateError.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(
          updateError,
          "No se pudo completar el registro. Intenta de nuevo.",
        ),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    apartment: { code: apartmentRow.code },
  });
}
