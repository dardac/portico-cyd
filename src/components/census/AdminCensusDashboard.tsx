"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import {
  buildCensusCopyText,
  copyTextToClipboard,
} from "@/lib/census/copy-results";
import { formatCensusPeople } from "@/lib/census/format-people";
import { downloadCensusExcel } from "@/lib/census/export-excel";
import { formatDateInCaracas, getTodayInCaracas } from "@/lib/dates";
import type { StaffRole } from "@/lib/auth/roles";
import { canViewResidentPii } from "@/lib/auth/roles";

type ApartmentProfile = {
  occupation: string;
  infrastructureStatus: string | null;
  infrastructureStatusLabel: string;
  gasPipeStatusLabel: string;
  waterPipeStatusLabel: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  updatedAt: string;
};

type CensusApartment = {
  id: string;
  code: string;
  unit: number;
  type: string;
  census: {
    willStayOvernight: boolean;
    adultCount: number | null;
    childrenCount: number | null;
    occupantNames: string | null;
    hasDisability: boolean | null;
    disabilityType: string | null;
    vehicleCount: number | null;
    petCount: number | null;
    updatedAt: string;
  } | null;
  profile: ApartmentProfile | null;
};

type TowerData = {
  code: string;
  floors: Array<{
    label: string;
    apartments: CensusApartment[];
  }>;
};

type CensusResponse = {
  censusDate: string;
  totals: {
    apartments: number;
    answered: number;
    staying: number;
    adults: number;
    children: number;
    people: number;
  };
  towers: TowerData[];
};

function IconDownload() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1-1.06 1.06L10.5 8.56v6.19a.75.75 0 0 1-1.5 0V8.56l-3.22 3.22a.75.75 0 0 1-1.06-1.06l4.25-4.25ZM3.75 15a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H3.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V14.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 14.5v-11A1.5 1.5 0 0 1 6.5 2H7v1.5Zm1.5 0v11h6V7.5h-2.25A1.5 1.5 0 0 1 11 6V3.5H8.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function InfrastructureBadge({ profile }: { profile: ApartmentProfile | null }) {
  if (!profile?.infrastructureStatus) return null;

  if (profile.infrastructureStatus === "uninhabitable") {
    return <span className="badge-danger">Inhabitable</span>;
  }

  if (profile.infrastructureStatus === "severe_damage") {
    return <span className="badge-warning">Daño severo</span>;
  }

  return null;
}

function CensusBadge({ apartment }: { apartment: CensusApartment }) {
  if (!apartment.census) {
    return <span className="badge-neutral">Sin respuesta</span>;
  }

  if (!apartment.census.willStayOvernight) {
    return <span className="badge-muted">No pernocta</span>;
  }

  return (
    <span className="badge-success">
      Sí ·{" "}
      {formatCensusPeople({
        adultCount: apartment.census.adultCount ?? 0,
        childrenCount: apartment.census.childrenCount ?? 0,
      })}
    </span>
  );
}

function formatCensusDisability(
  census: NonNullable<CensusApartment["census"]>,
): string {
  if (census.hasDisability === null) return "—";
  return census.hasDisability ? "Sí" : "No";
}

function formatDisability(census: NonNullable<CensusApartment["census"]>) {
  if (census.hasDisability === null) return "—";
  if (!census.hasDisability) return "No";
  return census.disabilityType ? `Sí · ${census.disabilityType}` : "Sí";
}

function whenStaying(
  staying: boolean,
  value: string | number | null | undefined,
): string {
  if (!staying) return "—";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function DetailTag({
  label,
  value,
  short,
  full,
}: {
  label: string;
  value: string;
  short?: boolean;
  full?: boolean;
}) {
  const classes = [
    "admin-apt-tag",
    short && "admin-apt-tag--short",
    full && "admin-apt-tag--full",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <span className="admin-apt-tag-label">{label}</span>
      <span className="admin-apt-tag-value">{value}</span>
    </div>
  );
}

function DetailTagPair({ children }: { children: ReactNode }) {
  return <div className="admin-apt-tag-pair">{children}</div>;
}

function formatEmergencyContact(
  profile: ApartmentProfile,
  canViewPii: boolean,
): string {
  if (!profile.emergencyContactPhone) return "—";

  if (canViewPii && profile.emergencyContactName) {
    return `${profile.emergencyContactName} · ${profile.emergencyContactPhone}`;
  }

  return profile.emergencyContactPhone;
}

function AdminApartmentRow({
  apartment,
  canViewPii,
}: {
  apartment: CensusApartment;
  canViewPii: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <div className={`admin-apt-row ${expanded ? "ring-1 ring-stone-200/80" : ""}`}>
      <button
        type="button"
        className="admin-apt-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={`Apartamento ${apartment.code}, ${expanded ? "ocultar" : "ver"} detalles`}
        onClick={() => setExpanded((open) => !open)}
      >
        <span className="admin-apt-trigger-left">
          <span className="admin-apt-code">{apartment.code}</span>
          {!expanded && (
            <span className="flex flex-wrap items-center gap-1.5">
              <CensusBadge apartment={apartment} />
              <InfrastructureBadge profile={apartment.profile} />
            </span>
          )}
        </span>
        <span className="admin-apt-trigger-right">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className={`admin-apt-chevron ${expanded ? "admin-apt-chevron-open" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {expanded && (
        <div id={panelId} className="admin-apt-panel">
          <div className="admin-apt-tags">
            <section className="admin-apt-tag-group">
              <h4 className="admin-apt-panel-title">Censo</h4>
              {apartment.census ? (
                <div className="admin-apt-tag-list">
                  <DetailTag
                    full
                    label="Pernocta"
                    value={apartment.census.willStayOvernight ? "Sí" : "No"}
                  />
                  <DetailTagPair>
                    <DetailTag
                      short
                      label="Adultos"
                      value={whenStaying(
                        apartment.census.willStayOvernight,
                        apartment.census.adultCount,
                      )}
                    />
                    <DetailTag
                      short
                      label="Niños y adolescentes"
                      value={whenStaying(
                        apartment.census.willStayOvernight,
                        apartment.census.childrenCount,
                      )}
                    />
                  </DetailTagPair>
                  {canViewPii && (
                    <>
                      <DetailTag
                        full
                        label="Ocupación"
                        value={apartment.profile?.occupation ?? "—"}
                      />
                      <DetailTag
                        full
                        label="Ocupantes"
                        value={whenStaying(
                          apartment.census.willStayOvernight,
                          apartment.census.occupantNames,
                        )}
                      />
                    </>
                  )}
                  {canViewPii ? (
                    <>
                      <DetailTag
                        full
                        label="Discapacidad"
                        value={formatCensusDisability(apartment.census)}
                      />
                      <DetailTag
                        full
                        label="Tipo discapacidad"
                        value={
                          apartment.census.hasDisability
                            ? apartment.census.disabilityType ?? "—"
                            : "—"
                        }
                      />
                      <DetailTagPair>
                        <DetailTag
                          short
                          label="Vehículos"
                          value={whenStaying(
                            apartment.census.willStayOvernight,
                            apartment.census.vehicleCount,
                          )}
                        />
                        <DetailTag
                          short
                          label="Mascotas"
                          value={whenStaying(
                            apartment.census.willStayOvernight,
                            apartment.census.petCount,
                          )}
                        />
                      </DetailTagPair>
                    </>
                  ) : (
                    apartment.census.willStayOvernight && (
                      <>
                        <DetailTag
                          full
                          label="Discapacidad"
                          value={formatDisability(apartment.census)}
                        />
                        <DetailTagPair>
                          <DetailTag
                            short
                            label="Vehículos"
                            value={String(apartment.census.vehicleCount ?? "—")}
                          />
                          <DetailTag
                            short
                            label="Mascotas"
                            value={String(apartment.census.petCount ?? "—")}
                          />
                        </DetailTagPair>
                      </>
                    )
                  )}
                </div>
              ) : (
                <span className="admin-apt-tag-empty">Sin respuesta de censo</span>
              )}
            </section>

            <section className="admin-apt-tag-group">
              <h4 className="admin-apt-panel-title">Apartamento</h4>
              {apartment.profile ? (
                <div className="admin-apt-tag-list">
                  <DetailTag
                    full
                    label="Infraestructura"
                    value={apartment.profile.infrastructureStatusLabel}
                  />
                  <DetailTag
                    full
                    label="Tuberías de gas"
                    value={apartment.profile.gasPipeStatusLabel}
                  />
                  <DetailTag
                    full
                    label="Tuberías de agua"
                    value={apartment.profile.waterPipeStatusLabel}
                  />
                  <DetailTag
                    full
                    label={
                      canViewPii ? "Contacto de emergencia" : "Tel. emergencia"
                    }
                    value={formatEmergencyContact(apartment.profile, canViewPii)}
                  />
                </div>
              ) : (
                <span className="admin-apt-tag-empty">Sin perfil este día</span>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

type AdminCensusDashboardProps = {
  staffRole: StaffRole;
};

export function AdminCensusDashboard({ staffRole }: AdminCensusDashboardProps) {
  const canViewPii = canViewResidentPii(staffRole);
  const [selectedDate, setSelectedDate] = useState(getTodayInCaracas());
  const [data, setData] = useState<CensusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCensus() {
      try {
        const response = await fetch(
          `/api/admin/census?date=${selectedDate}`,
        );
        const payload = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setError(payload.error ?? "No se pudo cargar el censo.");
          setData(null);
          setCopyState("idle");
          return;
        }

        setError(null);
        setData(payload);
        setCopyState("idle");
      } catch {
        if (cancelled) return;
        setError("Error de conexión al cargar el censo.");
        setData(null);
        setCopyState("idle");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCensus();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  function handleDateChange(nextDate: string) {
    setCopyState("idle");
    setError(null);
    setIsLoading(true);
    setSelectedDate(nextDate);
  }

  async function handleExportExcel() {
    if (!data) return;
    downloadCensusExcel(data);
  }

  async function handleCopyResults() {
    if (!data) return;

    const text = buildCensusCopyText(data);
    const copied = await copyTextToClipboard(text);
    setCopyState(copied ? "copied" : "error");

    if (copied) {
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  const responseRate =
    data && data.totals.apartments > 0
      ? Math.round((data.totals.answered / data.totals.apartments) * 100)
      : 0;

  return (
    <div className="page-content space-y-6">
      <header className="page-header">
        <div className="page-header-row">
          <div className="page-header-main">
            <h1 className="page-title">Censo diario</h1>
            <p className="page-subtitle">Vista por torres y pisos</p>
          </div>

          <div className="page-header-toolbar">
          <div className="page-header-filter">
            <label htmlFor="census-date" className="page-header-filter-label">
              Fecha
            </label>
            <input
              id="census-date"
              type="date"
              value={selectedDate}
              onChange={(event) => handleDateChange(event.target.value)}
              className="field-input page-header-filter-input"
            />
          </div>

          {canViewPii && (
            <div className="page-header-toolbar-actions">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!data || isLoading}
                className="btn-ghost page-header-toolbar-btn"
              >
                <IconDownload />
                Exportar
              </button>

              <button
                type="button"
                onClick={handleCopyResults}
                disabled={!data || isLoading}
                className="btn-ghost page-header-toolbar-btn"
                aria-live="polite"
              >
                {copyState === "copied" ? (
                  <>
                    <IconCheck />
                    Copiado
                  </>
                ) : copyState === "error" ? (
                  <>
                    <IconClipboard />
                    Error
                  </>
                ) : (
                  <>
                    <IconClipboard />
                    Copiar
                  </>
                )}
              </button>
            </div>
          )}
          </div>
        </div>
      </header>

      {data && (
        <div className="space-y-4">
          <div className="stats-bar">
            {[
              { label: "Apartamentos", value: data.totals.apartments },
              { label: "Respondieron", value: data.totals.answered },
              { label: "Pernoctan", value: data.totals.staying },
              { label: "Adultos", value: data.totals.adults },
              { label: "Niños/adoles.", value: data.totals.children },
              { label: "Total personas", value: data.totals.people },
            ].map((stat) => (
              <div key={stat.label} className="stats-bar-item">
                <p className="text-[11px] font-medium tracking-wide text-stone-400 uppercase">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-stone-200/60 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-stone-500">
              {formatDateInCaracas(data.censusDate)}
            </p>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100 sm:max-w-48">
                <div
                  className="h-full rounded-full bg-brick transition-all"
                  style={{ width: `${responseRate}%` }}
                />
              </div>
              <span className="text-xs font-medium text-stone-500">
                {responseRate}% respondido
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="alert-error">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="app-card py-16 text-center text-sm text-stone-400">
          Cargando censo…
        </div>
      ) : (
        <div className="admin-tower-stack">
          {data?.towers.map((tower) => (
            <section key={tower.code} className="admin-tower-section">
              <div className="admin-tower-header">
                <h2 className="section-title text-base">Torre {tower.code}</h2>
              </div>

              <div className="admin-tower-body">
                {tower.floors.map((floor) => (
                  <div key={floor.label} className="admin-floor-block">
                    <h3 className="admin-floor-label">{floor.label}</h3>
                    <div className="admin-apt-list">
                      {floor.apartments.map((apartment) => (
                        <AdminApartmentRow
                          key={apartment.id}
                          apartment={apartment}
                          canViewPii={canViewPii}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
