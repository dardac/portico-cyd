import { NextResponse } from "next/server";
import {
  mapSupportPost,
  SUPPORT_POST_SELECT,
  type SupportPostRow,
} from "@/lib/support-board/map-post";
import { getValidatedSession } from "@/lib/auth/session";
import { isStaffSession } from "@/lib/auth/roles";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function canClosePost(row: SupportPostRow, session: NonNullable<Awaited<ReturnType<typeof getValidatedSession>>>): boolean {
  if (row.status !== "open") return false;

  if (session.type === "resident") {
    return row.created_by_apartment_id === session.apartmentId;
  }

  if (isStaffSession(session)) {
    return row.created_by_admin_id === session.adminId;
  }

  return false;
}

export async function PATCH(_request: Request, context: RouteContext) {
  const session = await getValidatedSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("support_board_posts")
    .select(SUPPORT_POST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      {
        error: mapSupabaseError(fetchError, "No se pudo cargar la publicación."),
      },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json(
      { error: "La publicación no existe." },
      { status: 404 },
    );
  }

  const row = existing as SupportPostRow;

  if (!canClosePost(row, session)) {
    return NextResponse.json(
      { error: "No puedes cerrar esta publicación." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("support_board_posts")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "open")
    .select(SUPPORT_POST_SELECT)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: mapSupabaseError(error, "No se pudo cerrar la publicación."),
      },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "La publicación ya no está activa." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    post: mapSupportPost(data as SupportPostRow, session),
  });
}
