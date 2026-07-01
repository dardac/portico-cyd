import { NextResponse } from "next/server";
import { isSupportCategory } from "@/lib/support-board/constants";
import {
  mapSupportPost,
  SUPPORT_POST_SELECT,
  type SupportPostRow,
} from "@/lib/support-board/map-post";
import { getValidatedSession } from "@/lib/auth/session";
import { isStaffSession } from "@/lib/auth/roles";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  exceedsMaxLength,
  isValidApartment,
  isValidPhone,
  MAX_CONTACT_NAME_LENGTH,
  MAX_SUPPORT_DESCRIPTION_LENGTH,
  normalizeApartmentCode,
} from "@/lib/validators";
import { isSupportPostType } from "@/lib/support-board/constants";

export async function GET(request: Request) {
  const session = await getValidatedSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category");

  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("support_board_posts")
    .select(SUPPORT_POST_SELECT)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (
    categoryParam &&
    categoryParam !== "all" &&
    isSupportCategory(categoryParam)
  ) {
    query = query.eq("category", categoryParam);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      {
        error: mapSupabaseError(error, "No se pudo cargar la cartelera."),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    posts: (data ?? []).map((row) =>
      mapSupportPost(row as SupportPostRow, session),
    ),
  });
}

export async function POST(request: Request) {
  const session = await getValidatedSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: {
    postType?: string;
    category?: string;
    apartmentCode?: string;
    description?: string;
    contactName?: string;
    contactPhone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const postType = body.postType ?? "";
  const category = body.category ?? "";
  const apartmentCode =
    session.type === "resident"
      ? normalizeApartmentCode(session.apartmentCode)
      : normalizeApartmentCode(body.apartmentCode ?? "");
  const description = body.description?.trim() ?? "";
  const contactName = body.contactName?.trim() ?? "";
  const contactPhone = body.contactPhone?.trim() ?? "";

  if (!isSupportPostType(postType)) {
    return NextResponse.json(
      { error: "Selecciona si necesitas u ofreces ayuda." },
      { status: 400 },
    );
  }

  if (!isSupportCategory(category)) {
    return NextResponse.json(
      { error: "Selecciona una categoría válida." },
      { status: 400 },
    );
  }

  if (!isValidApartment(apartmentCode)) {
    return NextResponse.json(
      { error: "Indica un apartamento válido (ej. 11-D)." },
      { status: 400 },
    );
  }

  if (!description) {
    return NextResponse.json(
      { error: "Describe la ayuda o necesidad." },
      { status: 400 },
    );
  }

  if (exceedsMaxLength(description, MAX_SUPPORT_DESCRIPTION_LENGTH)) {
    return NextResponse.json(
      { error: "La descripción es demasiado larga." },
      { status: 400 },
    );
  }

  if (!contactName) {
    return NextResponse.json(
      { error: "Indica el nombre de contacto." },
      { status: 400 },
    );
  }

  if (exceedsMaxLength(contactName, MAX_CONTACT_NAME_LENGTH)) {
    return NextResponse.json(
      { error: "El nombre de contacto es demasiado largo." },
      { status: 400 },
    );
  }

  if (!isValidPhone(contactPhone)) {
    return NextResponse.json(
      { error: "Indica un teléfono válido (mínimo 10 dígitos)." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();
  const insertRow = {
    post_type: postType,
    category,
    apartment_code: apartmentCode,
    description,
    contact_name: contactName,
    contact_phone: contactPhone,
    created_by_apartment_id:
      session.type === "resident" ? session.apartmentId : null,
    created_by_admin_id: isStaffSession(session) ? session.adminId : null,
  };

  const { data, error } = await supabase
    .from("support_board_posts")
    .insert(insertRow)
    .select(SUPPORT_POST_SELECT)
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: mapSupabaseError(error, "No se pudo publicar en la cartelera."),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    post: mapSupportPost(data as SupportPostRow, session),
  });
}
