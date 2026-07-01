import { NextResponse } from "next/server";
import {
  mapSupportPost,
  SUPPORT_POST_SELECT,
  type SupportPostRow,
} from "@/lib/support-board/map-post";
import { getValidatedSession } from "@/lib/auth/session";
import { hasFullAdminAccess, isStaffSession } from "@/lib/auth/roles";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const session = await getValidatedSession();

  if (!session || !isStaffSession(session) || !hasFullAdminAccess(session)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("support_board_posts")
    .update({
      status: "attended",
      attended_at: new Date().toISOString(),
      attended_by_admin_id: session.adminId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "open")
    .select(SUPPORT_POST_SELECT)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: mapSupabaseError(error, "No se pudo marcar la publicación."),
      },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "La publicación no existe o ya fue cerrada." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    post: mapSupportPost(data as SupportPostRow, session),
  });
}
