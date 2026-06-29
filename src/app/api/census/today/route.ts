import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTodayInCaracas, getYesterdayInCaracas } from "@/lib/dates";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function mapEntry(row: {
  will_stay_overnight: boolean;
  people_count: number | null;
  updated_at: string;
}) {
  return {
    willStayOvernight: row.will_stay_overnight,
    peopleCount: row.people_count,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const session = await getSession();

  if (!session || session.type !== "resident") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const censusDate = getTodayInCaracas();
  const yesterdayDate = getYesterdayInCaracas();
  const supabase = createSupabaseServerClient();

  const { data: todayRow, error: todayError } = await supabase
    .from("daily_census")
    .select("will_stay_overnight, people_count, updated_at")
    .eq("apartment_id", session.apartmentId)
    .eq("census_date", censusDate)
    .maybeSingle();

  if (todayError) {
    console.error("Error al leer censo:", todayError.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(
          todayError,
          "No se pudo cargar el censo de hoy.",
        ),
      },
      { status: 500 },
    );
  }

  if (todayRow) {
    return NextResponse.json({
      censusDate,
      entry: mapEntry(todayRow),
      isSaved: true,
      prefill: null,
    });
  }

  const { data: yesterdayRow, error: yesterdayError } = await supabase
    .from("daily_census")
    .select("will_stay_overnight, people_count, updated_at")
    .eq("apartment_id", session.apartmentId)
    .eq("census_date", yesterdayDate)
    .maybeSingle();

  if (yesterdayError) {
    console.error("Error al leer censo de ayer:", yesterdayError.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(
          yesterdayError,
          "No se pudo cargar el censo de hoy.",
        ),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    censusDate,
    entry: null,
    isSaved: false,
    prefill: yesterdayRow
      ? {
          fromDate: yesterdayDate,
          ...mapEntry(yesterdayRow),
        }
      : null,
  });
}

export async function PUT(request: Request) {
  const session = await getSession();

  if (!session || session.type !== "resident") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: { willStayOvernight?: boolean; peopleCount?: number | null };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (typeof body.willStayOvernight !== "boolean") {
    return NextResponse.json(
      { error: "Indica si pernoctarás hoy en el edificio." },
      { status: 400 },
    );
  }

  const willStayOvernight = body.willStayOvernight;
  const peopleCount = willStayOvernight ? body.peopleCount : null;

  if (willStayOvernight) {
    if (!peopleCount || peopleCount < 1 || peopleCount > 999) {
      return NextResponse.json(
        { error: "Indica cuántas personas pernoctarán (entre 1 y 999)." },
        { status: 400 },
      );
    }
  }

  const censusDate = getTodayInCaracas();
  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("daily_census")
    .upsert(
      {
        apartment_id: session.apartmentId,
        census_date: censusDate,
        will_stay_overnight: willStayOvernight,
        people_count: peopleCount,
        updated_at: now,
      },
      { onConflict: "apartment_id,census_date" },
    )
    .select("will_stay_overnight, people_count, updated_at")
    .single();

  if (error) {
    console.error("Error al guardar censo:", error.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(error, "No se pudo guardar el censo."),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    censusDate,
    entry: mapEntry(data),
    isSaved: true,
    prefill: null,
  });
}
