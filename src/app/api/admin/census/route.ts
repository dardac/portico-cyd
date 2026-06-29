import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
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
  people_count: number | null;
  updated_at: string;
};

export async function GET(request: Request) {
  const session = await getSession();

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
    .select("apartment_id, will_stay_overnight, people_count, updated_at")
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

  const censusByApartment = new Map(
    (censusRows as CensusRow[]).map((row) => [row.apartment_id, row]),
  );

  const towers = buildTowerSummary(
    apartments as ApartmentRow[],
    censusByApartment,
  );

  const totals = {
    apartments: apartments.length,
    answered: censusRows?.length ?? 0,
    staying: censusRows?.filter((row) => row.will_stay_overnight).length ?? 0,
    people:
      censusRows?.reduce(
        (sum, row) => sum + (row.will_stay_overnight ? (row.people_count ?? 0) : 0),
        0,
      ) ?? 0,
  };

  return NextResponse.json({ censusDate, totals, towers });
}

function buildTowerSummary(
  apartments: ApartmentRow[],
  censusByApartment: Map<string, CensusRow>,
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
              peopleCount: number | null;
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
            peopleCount: census.people_count,
            updatedAt: census.updated_at,
          }
        : null,
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
