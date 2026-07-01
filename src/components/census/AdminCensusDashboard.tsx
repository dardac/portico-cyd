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
import {
  formatApartmentInput,
  isValidApartment,
  normalizeApartmentCode,
} from "@/lib/validators";

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
              <h4 className="admin-apt-panel-title">Registro diario</h4>
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
                <span className="admin-apt-tag-empty">Sin respuesta de registro diario</span>
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

type TowerFilter = "all" | "C" | "D";

function filterCensusTowers(
  towers: TowerData[],
  towerFilter: TowerFilter,
  apartmentFilter: string,
): TowerData[] {
  let filtered = towers;

  if (towerFilter !== "all") {
    filtered = filtered.filter((tower) => tower.code === towerFilter);
  }

  const normalizedApartment = apartmentFilter.trim()
    ? normalizeApartmentCode(apartmentFilter)
    : "";

  if (normalizedApartment && isValidApartment(apartmentFilter)) {
    filtered = filtered
      .map((tower) => ({
        ...tower,
        floors: tower.floors
          .map((floor) => ({
            ...floor,
            apartments: floor.apartments.filter(
              (apartment) =>
                normalizeApartmentCode(apartment.code) === normalizedApartment,
            ),
          }))
          .filter((floor) => floor.apartments.length > 0),
      }))
      .filter((tower) => tower.floors.length > 0);
  }

  return filtered;
}

function countVisibleApartments(towers: TowerData[]): number {
  return towers.reduce(
    (total, tower) =>
      total +
      tower.floors.reduce(
        (floorTotal, floor) => floorTotal + floor.apartments.length,
        0,
      ),
    0,
  );
}

function AdminTowerSection({
  tower,
  collapsed,
  onToggle,
  canViewPii,
}: {
  tower: TowerData;
  collapsed: boolean;
  onToggle: () => void;
  canViewPii: boolean;
}) {
  const panelId = useId();
  const apartmentCount = countVisibleApartments([tower]);

  return (
    <section className="admin-tower-section">
      <button
        type="button"
        className="admin-tower-trigger"
        aria-expanded={!collapsed}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="admin-tower-trigger-main">
          <h2 className="section-title text-base">Torre {tower.code}</h2>
          <span className="admin-tower-trigger-meta">
            {apartmentCount} apartamento{apartmentCount === 1 ? "" : "s"}
          </span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={`admin-apt-chevron ${collapsed ? "" : "admin-apt-chevron-open"}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {!collapsed && (
        <div id={panelId} className="admin-tower-body">
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
      )}
    </section>
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
  const [towerFilter, setTowerFilter] = useState<TowerFilter>("all");
  const [apartmentFilter, setApartmentFilter] = useState("");
  const [collapsedTowers, setCollapsedTowers] = useState<
    Record<string, boolean>
  >({});

  const apartmentFilterError =
    apartmentFilter.trim() && !isValidApartment(apartmentFilter)
      ? "Usa el formato piso+unidad-letra (ej. 11-D), NT/PH + número + letra (ej. NT1-D)."
      : null;

  const filteredTowers =
    data && !apartmentFilterError
      ? filterCensusTowers(data.towers, towerFilter, apartmentFilter)
      : [];

  const hasActiveFilters =
    towerFilter !== "all" ||
    (apartmentFilter.trim() !== "" && !apartmentFilterError);

  const visibleApartmentCount = countVisibleApartments(filteredTowers);

  function toggleTowerCollapse(towerCode: string) {
    setCollapsedTowers((current) => ({
      ...current,
      [towerCode]: !current[towerCode],
    }));
  }

  function handleTowerFilterChange(nextFilter: TowerFilter) {
    setTowerFilter(nextFilter);
    if (nextFilter !== "all") {
      setCollapsedTowers((current) => ({
        ...current,
        [nextFilter]: false,
      }));
    }
  }

  function handleApartmentFilterChange(value: string) {
    const formatted = formatApartmentInput(value);
    setApartmentFilter(formatted);

    if (formatted.trim() && isValidApartment(formatted) && data) {
      const matchingTower = data.towers.find((tower) =>
        tower.floors.some((floor) =>
          floor.apartments.some(
            (apartment) =>
              normalizeApartmentCode(apartment.code) ===
              normalizeApartmentCode(formatted),
          ),
        ),
      );

      if (matchingTower) {
        setTowerFilter(matchingTower.code as TowerFilter);
        setCollapsedTowers((current) => ({
          ...current,
          [matchingTower.code]: false,
        }));
      }
    }
  }

  function clearFilters() {
    setTowerFilter("all");
    setApartmentFilter("");
  }

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
          setError(payload.error ?? "No se pudo cargar el registro.");
          setData(null);
          setCopyState("idle");
          return;
        }

        setError(null);
        setData(payload);
        setCopyState("idle");
      } catch {
        if (cancelled) return;
        setError("Error de conexión al cargar el registro.");
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
            <h1 className="page-title">Registro diario</h1>
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
                <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="app-card-compact space-y-4">
            <div className="census-filter-bar">
              <div className="census-filter-field">
                <p id="census-tower-filter-label" className="field-label">
                  Torre
                </p>
                <div
                  className="bulletin-filters census-filter-chips"
                  role="group"
                  aria-labelledby="census-tower-filter-label"
                >
                  {(
                    [
                      { value: "all", label: "Todas" },
                      { value: "C", label: "Torre C" },
                      { value: "D", label: "Torre D" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={towerFilter === option.value}
                      onClick={() => handleTowerFilterChange(option.value)}
                      className={`bulletin-filter-chip ${
                        towerFilter === option.value
                          ? "bulletin-filter-chip--active"
                          : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="census-filter-field census-filter-field--apartment">
                <label htmlFor="census-apartment-filter" className="field-label">
                  Apartamento
                </label>
                <input
                  id="census-apartment-filter"
                  type="text"
                  inputMode="text"
                  value={apartmentFilter}
                  onChange={(event) =>
                    handleApartmentFilterChange(event.target.value)
                  }
                  placeholder="11-D, NT1-D, PH3-C"
                  aria-invalid={Boolean(apartmentFilterError)}
                  aria-describedby={
                    apartmentFilterError
                      ? "census-apartment-filter-error"
                      : "census-apartment-filter-hint"
                  }
                  className="field-input"
                />
                {apartmentFilterError ? (
                  <p
                    id="census-apartment-filter-error"
                    className="field-error"
                    role="alert"
                  >
                    {apartmentFilterError}
                  </p>
                ) : (
                  <p
                    id="census-apartment-filter-hint"
                    className="field-hint"
                  >
                    Deja vacío para ver todos los apartamentos.
                  </p>
                )}
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
                <p className="text-sm text-stone-500" role="status">
                  Mostrando {visibleApartmentCount} apartamento
                  {visibleApartmentCount === 1 ? "" : "s"}
                  {apartmentFilterError ? " (corrige el formato del apartamento)" : ""}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-ghost"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
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
          Cargando registro…
        </div>
      ) : filteredTowers.length === 0 ? (
        <div className="bulletin-empty">
          <p className="bulletin-empty-title">
            {apartmentFilterError
              ? "Formato de apartamento inválido"
              : "No hay apartamentos con estos filtros"}
          </p>
          <p className="bulletin-empty-text">
            {apartmentFilterError
              ? "Corrige el código del apartamento o limpia los filtros."
              : "Prueba otra torre o borra el filtro de apartamento."}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="btn-ghost mt-4"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="admin-tower-stack">
          {filteredTowers.map((tower) => (
            <AdminTowerSection
              key={tower.code}
              tower={tower}
              collapsed={collapsedTowers[tower.code] ?? false}
              onToggle={() => toggleTowerCollapse(tower.code)}
              canViewPii={canViewPii}
            />
          ))}
        </div>
      )}
    </div>
  );
}
