import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/session";
import {
  isValidInfrastructureStatus,
  type InfrastructureStatus,
} from "@/lib/apartment/infrastructure-status";
import {
  isValidPipeStatus,
  type PipeStatus,
} from "@/lib/apartment/pipe-status";
import { getTodayInCaracas, getYesterdayInCaracas } from "@/lib/dates";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  MAX_PHONE_LENGTH,
  MAX_TEXT_FIELD_LENGTH,
  exceedsMaxLength,
  isValidPhone,
} from "@/lib/validators";

function mapEntry(row: {
  occupation: string;
  infrastructure_status: string | null;
  gas_pipe_status: string | null;
  water_pipe_status: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  updated_at: string;
}) {
  return {
    occupation: row.occupation,
    infrastructureStatus: row.infrastructure_status as InfrastructureStatus | null,
    gasPipeStatus: row.gas_pipe_status as PipeStatus | null,
    waterPipeStatus: row.water_pipe_status as PipeStatus | null,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    updatedAt: row.updated_at,
  };
}

const PROFILE_SELECT =
  "occupation, infrastructure_status, gas_pipe_status, water_pipe_status, emergency_contact_name, emergency_contact_phone, updated_at";

export async function GET() {
  const session = await getValidatedSession();

  if (!session || session.type !== "resident") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const profileDate = getTodayInCaracas();
  const yesterdayDate = getYesterdayInCaracas();
  const supabase = createSupabaseServerClient();

  const { data: todayRow, error: todayError } = await supabase
    .from("daily_apartment_profile")
    .select(PROFILE_SELECT)
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
    .select(PROFILE_SELECT)
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
  const session = await getValidatedSession();

  if (!session || session.type !== "resident") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: {
    occupation?: string;
    infrastructureStatus?: string;
    gasPipeStatus?: string;
    waterPipeStatus?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const occupation = body.occupation?.trim() ?? "";
  const infrastructureStatus = body.infrastructureStatus ?? "";
  const gasPipeStatus = body.gasPipeStatus ?? "";
  const waterPipeStatus = body.waterPipeStatus ?? "";
  const emergencyContactName = body.emergencyContactName?.trim() ?? "";
  const emergencyContactPhone = body.emergencyContactPhone?.trim() ?? "";

  if (occupation && exceedsMaxLength(occupation, MAX_TEXT_FIELD_LENGTH)) {
    return NextResponse.json(
      { error: "La ocupación es demasiado larga." },
      { status: 400 },
    );
  }

  if (!isValidInfrastructureStatus(infrastructureStatus)) {
    return NextResponse.json(
      { error: "Indica el estado del apartamento (infraestructura)." },
      { status: 400 },
    );
  }

  if (!isValidPipeStatus(gasPipeStatus)) {
    return NextResponse.json(
      { error: "Indica el estado de las tuberías de gas." },
      { status: 400 },
    );
  }

  if (!isValidPipeStatus(waterPipeStatus)) {
    return NextResponse.json(
      { error: "Indica el estado de las tuberías de agua." },
      { status: 400 },
    );
  }

  if (!emergencyContactName) {
    return NextResponse.json(
      { error: "Indica el nombre y apellido del contacto de emergencia." },
      { status: 400 },
    );
  }

  if (exceedsMaxLength(emergencyContactName, MAX_TEXT_FIELD_LENGTH)) {
    return NextResponse.json(
      { error: "El nombre del contacto de emergencia es demasiado largo." },
      { status: 400 },
    );
  }

  if (!emergencyContactPhone) {
    return NextResponse.json(
      { error: "Indica el teléfono del contacto de emergencia." },
      { status: 400 },
    );
  }

  if (
    !isValidPhone(emergencyContactPhone) ||
    exceedsMaxLength(emergencyContactPhone, MAX_PHONE_LENGTH)
  ) {
    return NextResponse.json(
      { error: "Ingresa un teléfono de emergencia válido (mínimo 10 dígitos)." },
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
        infrastructure_status: infrastructureStatus,
        gas_pipe_status: gasPipeStatus,
        water_pipe_status: waterPipeStatus,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        updated_at: now,
      },
      { onConflict: "apartment_id,profile_date" },
    )
    .select(PROFILE_SELECT)
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
