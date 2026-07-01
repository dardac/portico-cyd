import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getStaffRoleLabel, isStaffSession, normalizeStaffRole } from "@/lib/auth/roles";
import { getValidatedSession } from "@/lib/auth/session";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  exceedsMaxLength,
  isValidEmail,
  isValidPhone,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_PHONE_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/lib/validators";

export async function GET() {
  const session = await getValidatedSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();

  if (session.type === "resident") {
    const { data, error } = await supabase
      .from("apartments")
      .select("code, email, phone")
      .eq("id", session.apartmentId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: "No se pudo cargar el perfil." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      profile: {
        type: "resident",
        apartmentCode: data.code,
        email: data.email ?? "",
        phone: data.phone ?? "",
      },
    });
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("username, role, email, phone")
    .eq("id", session.adminId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "No se pudo cargar el perfil." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    profile: {
      type: "admin",
      username: data.username,
      roleLabel: getStaffRoleLabel(normalizeStaffRole(data.role)),
      email: data.email ?? "",
      phone: data.phone ?? "",
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getValidatedSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: {
    email?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone?.trim() ?? "";
  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";

  if (!email || !phone) {
    return NextResponse.json(
      { error: "Correo y teléfono son obligatorios." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email) || exceedsMaxLength(email, MAX_EMAIL_LENGTH)) {
    return NextResponse.json(
      { error: "Ingresa un correo electrónico válido." },
      { status: 400 },
    );
  }

  if (!isValidPhone(phone) || exceedsMaxLength(phone, MAX_PHONE_LENGTH)) {
    return NextResponse.json(
      { error: "Ingresa un número de teléfono válido (mínimo 10 dígitos)." },
      { status: 400 },
    );
  }

  const isChangingPassword = Boolean(newPassword);

  if (isChangingPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Indica tu contraseña actual para cambiarla." },
        { status: 400 },
      );
    }

    if (
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > MAX_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `La nueva contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.`,
        },
        { status: 400 },
      );
    }
  }

  const supabase = createSupabaseServerClient();

  if (session.type === "resident") {
    const { data: apartmentRow, error: fetchError } = await supabase
      .from("apartments")
      .select("id, password_hash")
      .eq("id", session.apartmentId)
      .maybeSingle();

    if (fetchError || !apartmentRow) {
      return NextResponse.json(
        { error: "No se pudo actualizar el perfil." },
        { status: 500 },
      );
    }

    if (isChangingPassword) {
      const passwordMatches = await verifyPassword(
        currentPassword,
        apartmentRow.password_hash,
      );

      if (!passwordMatches) {
        return NextResponse.json(
          { error: "La contraseña actual no es correcta." },
          { status: 400 },
        );
      }
    }

    const updatePayload: {
      email: string;
      phone: string;
      updated_at: string;
      password_hash?: string;
    } = {
      email,
      phone,
      updated_at: new Date().toISOString(),
    };

    if (isChangingPassword) {
      updatePayload.password_hash = await hashPassword(newPassword);
    }

    const { data, error } = await supabase
      .from("apartments")
      .update(updatePayload)
      .eq("id", session.apartmentId)
      .select("code, email, phone")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: mapSupabaseError(error, "No se pudo actualizar el perfil."),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      profile: {
        type: "resident",
        apartmentCode: data.code,
        email: data.email ?? "",
        phone: data.phone ?? "",
      },
    });
  }

  if (!isStaffSession(session)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: adminRow, error: fetchError } = await supabase
    .from("admin_users")
    .select("id, password_hash, username, role")
    .eq("id", session.adminId)
    .eq("is_active", true)
    .maybeSingle();

  if (fetchError || !adminRow) {
    return NextResponse.json(
      { error: "No se pudo actualizar el perfil." },
      { status: 500 },
    );
  }

  if (isChangingPassword) {
    const passwordMatches = await verifyPassword(
      currentPassword,
      adminRow.password_hash,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "La contraseña actual no es correcta." },
        { status: 400 },
      );
    }
  }

  const updatePayload: {
    email: string;
    phone: string;
    password_hash?: string;
  } = { email, phone };

  if (isChangingPassword) {
    updatePayload.password_hash = await hashPassword(newPassword);
  }

  const { data, error } = await supabase
    .from("admin_users")
    .update(updatePayload)
    .eq("id", session.adminId)
    .select("username, role, email, phone")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: mapSupabaseError(error, "No se pudo actualizar el perfil."),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    profile: {
      type: "admin",
      username: data.username,
      roleLabel: getStaffRoleLabel(normalizeStaffRole(data.role)),
      email: data.email ?? "",
      phone: data.phone ?? "",
    },
  });
}
