import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/session";
import { getTodayInCaracas } from "@/lib/dates";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ApartmentRow = {
  id: string;
  code: string;
  floor: number | null;
  unit: number;
  apartment_type: "standard" | "nt" | "ph";
  towers: { code: string } | { code: string }[];
};

function getTowerCode(apartment: ApartmentRow): string {
  return Array.isArray(apartment.towers)
    ? apartment.towers[0].code
    : apartment.towers.code;
}

type CensusRow = {
  apartment_id: string;
  will_stay_overnight: boolean;
  adult_count: number | null;
  children_count: number | null;
  updated_at: string;
};

type ProfileRow = {
  apartment_id: string;
  occupation: string;
  has_disability: boolean;
  disability_type: string | null;
  vehicle_count: number;
  pet_count: number;
  updated_at: string;
};

function mapProfile(row: ProfileRow) {
  return {
    occupation: row.occupation,
    hasDisability: row.has_disability,
    disabilityType: row.disability_type,
    vehicleCount: row.vehicle_count,
    petCount: row.pet_count,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const session = await getValidatedSession();

  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const censusDate = searchParams.get("date") ?? getTodayInCaracas();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(censusDate)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  const { data: apartments, error: apartmentsError } = await supabase
    .from("apartments")
    .select("id, code, floor, unit, apartment_type, towers!inner(code)")
    .eq("is_active", true)
    .order("code");

  if (apartmentsError) {
    console.error("Error al cargar apartamentos:", apartmentsError.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(
          apartmentsError,
          "No se pudo cargar el censo.",
        ),
      },
      { status: 500 },
    );
  }

  const { data: censusRows, error: censusError } = await supabase
    .from("daily_census")
    .select(
      "apartment_id, will_stay_overnight, adult_count, children_count, updated_at",
    )
    .eq("census_date", censusDate);

  if (censusError) {
    console.error("Error al cargar respuestas:", censusError.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(censusError, "No se pudo cargar el censo."),
      },
      { status: 500 },
    );
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("daily_apartment_profile")
    .select(
      "apartment_id, occupation, has_disability, disability_type, vehicle_count, pet_count, updated_at",
    )
    .eq("profile_date", censusDate);

  if (profileError) {
    console.error("Error al cargar perfiles:", profileError.message);
    return NextResponse.json(
      {
        error: mapSupabaseError(profileError, "No se pudo cargar el censo."),
      },
      { status: 500 },
    );
  }

  const censusByApartment = new Map(
    (censusRows as CensusRow[]).map((row) => [row.apartment_id, row]),
  );

  const profileByApartment = new Map(
    (profileRows as ProfileRow[]).map((row) => [row.apartment_id, row]),
  );

  const towers = buildTowerSummary(
    apartments as ApartmentRow[],
    censusByApartment,
    profileByApartment,
  );

  const totals = {
    apartments: apartments.length,
    answered: censusRows?.length ?? 0,
    staying: censusRows?.filter((row) => row.will_stay_overnight).length ?? 0,
    adults:
      censusRows?.reduce(
        (sum, row) =>
          sum + (row.will_stay_overnight ? (row.adult_count ?? 0) : 0),
        0,
      ) ?? 0,
    children:
      censusRows?.reduce(
        (sum, row) =>
          sum + (row.will_stay_overnight ? (row.children_count ?? 0) : 0),
        0,
      ) ?? 0,
    people:
      censusRows?.reduce(
        (sum, row) =>
          sum +
          (row.will_stay_overnight
            ? (row.adult_count ?? 0) + (row.children_count ?? 0)
            : 0),
        0,
      ) ?? 0,
  };

  return NextResponse.json({ censusDate, totals, towers });
}

function buildTowerSummary(
  apartments: ApartmentRow[],
  censusByApartment: Map<string, CensusRow>,
  profileByApartment: Map<string, ProfileRow>,
) {
  const towerMap = new Map<
    string,
    {
      code: string;
      floors: Map<
        string,
        {
          label: string;
          sortKey: number;
          apartments: Array<{
            id: string;
            code: string;
            unit: number;
            type: string;
            census: {
              willStayOvernight: boolean;
              adultCount: number | null;
              childrenCount: number | null;
              updatedAt: string;
            } | null;
            profile: {
              occupation: string;
              hasDisability: boolean;
              disabilityType: string | null;
              vehicleCount: number;
              petCount: number;
              updatedAt: string;
            } | null;
          }>;
        }
      >;
    }
  >();

  for (const apartment of apartments) {
    const towerCode = getTowerCode(apartment);

    if (!towerMap.has(towerCode)) {
      towerMap.set(towerCode, { code: towerCode, floors: new Map() });
    }

    const tower = towerMap.get(towerCode)!;
    const floorKey = getFloorKey(apartment);
    const census = censusByApartment.get(apartment.id);
    const profile = profileByApartment.get(apartment.id);

    if (!tower.floors.has(floorKey.key)) {
      tower.floors.set(floorKey.key, {
        label: floorKey.label,
        sortKey: floorKey.sortKey,
        apartments: [],
      });
    }

    tower.floors.get(floorKey.key)!.apartments.push({
      id: apartment.id,
      code: apartment.code,
      unit: apartment.unit,
      type: apartment.apartment_type,
      census: census
        ? {
            willStayOvernight: census.will_stay_overnight,
            adultCount: census.adult_count,
            childrenCount: census.children_count,
            updatedAt: census.updated_at,
          }
        : null,
      profile: profile ? mapProfile(profile) : null,
    });
  }

  return ["C", "D"]
    .filter((code) => towerMap.has(code))
    .map((code) => {
      const tower = towerMap.get(code)!;
      const floors = [...tower.floors.values()]
        .sort((a, b) => a.sortKey - b.sortKey)
        .map((floor) => ({
          label: floor.label,
          apartments: floor.apartments.sort((a, b) => a.unit - b.unit),
        }));

      return { code, floors };
    });
}

function getFloorKey(apartment: ApartmentRow) {
  if (apartment.apartment_type === "nt") {
    return { key: "nt", label: "NT", sortKey: 100 };
  }

  if (apartment.apartment_type === "ph") {
    return { key: "ph", label: "PH", sortKey: 101 };
  }

  return {
    key: `floor-${apartment.floor}`,
    label: `Piso ${apartment.floor}`,
    sortKey: apartment.floor ?? 0,
  };
}
