import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTodayInCaracas, getYesterdayInCaracas } from "@/lib/dates";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function mapEntry(row: {
  will_stay_overnight: boolean;
  adult_count: number | null;
  children_count: number | null;
  updated_at: string;
}) {
  return {
    willStayOvernight: row.will_stay_overnight,
    adultCount: row.adult_count,
    childrenCount: row.children_count,
    updatedAt: row.updated_at,
  };
}

function validatePeopleCounts(
  willStayOvernight: boolean,
  adultCount: number | null | undefined,
  childrenCount: number | null | undefined,
): string | null {
  if (!willStayOvernight) {
    return null;
  }

  if (
    typeof adultCount !== "number" ||
    typeof childrenCount !== "number" ||
    !Number.isInteger(adultCount) ||
    !Number.isInteger(childrenCount) ||
    adultCount < 0 ||
    childrenCount < 0 ||
    adultCount > 999 ||
    childrenCount > 999
  ) {
    return "Indica cuántos adultos y niños/adolescentes pernoctarán (0 a 999 cada uno).";
  }

  if (adultCount + childrenCount < 1) {
    return "Debe pernoctar al menos 1 persona (adulto o niño/adolescente).";
  }

  return null;
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
    .select("will_stay_overnight, adult_count, children_count, updated_at")
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
    .select("will_stay_overnight, adult_count, children_count, updated_at")
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

  let body: {
    willStayOvernight?: boolean;
    adultCount?: number | null;
    childrenCount?: number | null;
  };

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
  const adultCount = willStayOvernight ? body.adultCount : null;
  const childrenCount = willStayOvernight ? body.childrenCount : null;

  const validationError = validatePeopleCounts(
    willStayOvernight,
    adultCount,
    childrenCount,
  );

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
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
        adult_count: adultCount,
        children_count: childrenCount,
        updated_at: now,
      },
      { onConflict: "apartment_id,census_date" },
    )
    .select("will_stay_overnight, adult_count, children_count, updated_at")
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
