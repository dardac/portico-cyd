import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/session";
import { getTodayInCaracas } from "@/lib/dates";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getValidatedSession();

  if (!session || session.type !== "resident") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const today = getTodayInCaracas();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("daily_census")
    .select(
      "census_date, will_stay_overnight, adult_count, children_count, updated_at",
    )
    .eq("apartment_id", session.apartmentId)
    .lt("census_date", today)
    .order("census_date", { ascending: false });

  if (error) {
    console.error("Error al leer historial:", error.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(error, "No se pudo cargar tu historial."),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    apartmentCode: session.apartmentCode,
    entries: (data ?? []).map((row) => ({
      censusDate: row.census_date,
      willStayOvernight: row.will_stay_overnight,
      adultCount: row.adult_count,
      childrenCount: row.children_count,
      updatedAt: row.updated_at,
    })),
  });
}
