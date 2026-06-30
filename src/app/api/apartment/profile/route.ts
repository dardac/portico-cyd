import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTodayInCaracas, getYesterdayInCaracas } from "@/lib/dates";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MAX_COUNT } from "@/lib/validators";

function mapEntry(row: {
  occupation: string;
  has_disability: boolean;
  disability_type: string | null;
  vehicle_count: number;
  pet_count: number;
  updated_at: string;
}) {
  return {
    occupation: row.occupation,
    hasDisability: row.has_disability,
    disabilityType: row.disability_type,
    vehicleCount: row.vehicle_count,
    petCount: row.pet_count,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const session = await getSession();

  if (!session || session.type !== "resident") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const profileDate = getTodayInCaracas();
  const yesterdayDate = getYesterdayInCaracas();
  const supabase = createSupabaseServerClient();

  const { data: todayRow, error: todayError } = await supabase
    .from("daily_apartment_profile")
    .select(
      "occupation, has_disability, disability_type, vehicle_count, pet_count, updated_at",
    )
    .eq("apartment_id", session.apartmentId)
    .eq("profile_date", profileDate)
    .maybeSingle();

  if (todayError) {
    console.error("Error al leer perfil:", todayError.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(
          todayError,
          "No se pudo cargar los datos del apartamento.",
        ),
      },
      { status: 500 },
    );
  }

  if (todayRow) {
    return NextResponse.json({
      profileDate,
      entry: mapEntry(todayRow),
      isSaved: true,
      prefill: null,
    });
  }

  const { data: yesterdayRow, error: yesterdayError } = await supabase
    .from("daily_apartment_profile")
    .select(
      "occupation, has_disability, disability_type, vehicle_count, pet_count, updated_at",
    )
    .eq("apartment_id", session.apartmentId)
    .eq("profile_date", yesterdayDate)
    .maybeSingle();

  if (yesterdayError) {
    console.error("Error al leer perfil de ayer:", yesterdayError.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(
          yesterdayError,
          "No se pudo cargar los datos del apartamento.",
        ),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    profileDate,
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
    occupation?: string;
    hasDisability?: boolean;
    disabilityType?: string | null;
    vehicleCount?: number;
    petCount?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const occupation = body.occupation?.trim() ?? "";
  const hasDisability = body.hasDisability;
  const disabilityType = body.disabilityType?.trim() ?? "";
  const vehicleCount = body.vehicleCount;
  const petCount = body.petCount;

  if (!occupation) {
    return NextResponse.json(
      { error: "Indica la ocupación de los ocupantes del apartamento." },
      { status: 400 },
    );
  }

  if (typeof hasDisability !== "boolean") {
    return NextResponse.json(
      { error: "Indica si algún ocupante posee discapacidad." },
      { status: 400 },
    );
  }

  if (hasDisability && !disabilityType) {
    return NextResponse.json(
      { error: "Indica qué tipo de discapacidad presenta." },
      { status: 400 },
    );
  }

  if (
    typeof vehicleCount !== "number" ||
    vehicleCount < 0 ||
    vehicleCount > MAX_COUNT ||
    !Number.isInteger(vehicleCount)
  ) {
    return NextResponse.json(
      { error: `Indica la cantidad de vehículos (0 a ${MAX_COUNT}).` },
      { status: 400 },
    );
  }

  if (
    typeof petCount !== "number" ||
    petCount < 0 ||
    petCount > MAX_COUNT ||
    !Number.isInteger(petCount)
  ) {
    return NextResponse.json(
      { error: `Indica la cantidad de mascotas (0 a ${MAX_COUNT}).` },
      { status: 400 },
    );
  }

  const profileDate = getTodayInCaracas();
  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("daily_apartment_profile")
    .upsert(
      {
        apartment_id: session.apartmentId,
        profile_date: profileDate,
        occupation,
        has_disability: hasDisability,
        disability_type: hasDisability ? disabilityType : null,
        vehicle_count: vehicleCount,
        pet_count: petCount,
        updated_at: now,
      },
      { onConflict: "apartment_id,profile_date" },
    )
    .select(
      "occupation, has_disability, disability_type, vehicle_count, pet_count, updated_at",
    )
    .single();

  if (error) {
    console.error("Error al guardar perfil:", error.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(
          error,
          "No se pudieron guardar los datos del apartamento.",
        ),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    profileDate,
    entry: mapEntry(data),
    isSaved: true,
    prefill: null,
  });
}
