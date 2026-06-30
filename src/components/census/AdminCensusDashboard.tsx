"use client";

import { useEffect, useId, useState } from "react";
import {
  buildCensusCopyText,
  copyTextToClipboard,
} from "@/lib/census/copy-results";
import { downloadCensusExcel } from "@/lib/census/export-excel";
import { formatDateInCaracas, getTodayInCaracas } from "@/lib/dates";

type ApartmentProfile = {
  occupation: string;
  hasDisability: boolean;
  disabilityType: string | null;
  vehicleCount: number;
  petCount: number;
  updatedAt: string;
};

type CensusApartment = {
  id: string;
  code: string;
  unit: number;
  type: string;
  census: {
    willStayOvernight: boolean;
    peopleCount: number | null;
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
    people: number;
  };
  towers: TowerData[];
};

function CensusBadge({ apartment }: { apartment: CensusApartment }) {
  if (!apartment.census) {
    return <span className="badge-neutral">Sin respuesta</span>;
  }

  if (!apartment.census.willStayOvernight) {
    return <span className="badge-muted">No pernocta</span>;
  }

  return (
    <span className="badge-success">
      Sí · {apartment.census.peopleCount}{" "}
      {apartment.census.peopleCount === 1 ? "persona" : "personas"}
    </span>
  );
}

function formatDisability(profile: ApartmentProfile) {
  if (!profile.hasDisability) return "No";
  return profile.disabilityType
    ? `Sí · ${profile.disabilityType}`
    : "Sí";
}

function DetailTag({ label, value }: { label: string; value: string }) {
  return (
    <span className="admin-apt-tag">
      <span className="admin-apt-tag-label">{label}</span>
      <span className="admin-apt-tag-value">{value}</span>
    </span>
  );
}

function AdminApartmentRow({ apartment }: { apartment: CensusApartment }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <div className={`admin-apt-row ${expanded ? "ring-1 ring-stone-200/80" : ""}`}>
      <button
        type="button"
        className="admin-apt-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((open) => !open)}
      >
        <span className="admin-apt-trigger-left">
          <span className="admin-apt-code">{apartment.code}</span>
          {!expanded && <CensusBadge apartment={apartment} />}
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
                    label="Pernocta"
                    value={apartment.census.willStayOvernight ? "Sí" : "No"}
                  />
                  <DetailTag
                    label="Personas"
                    value={
                      apartment.census.willStayOvernight
                        ? String(apartment.census.peopleCount ?? "—")
                        : "—"
                    }
                  />
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
                    label="Ocupación"
                    value={apartment.profile.occupation}
                  />
                  <DetailTag
                    label="Discapacidad"
                    value={formatDisability(apartment.profile)}
                  />
                  <DetailTag
                    label="Vehículos"
                    value={String(apartment.profile.vehicleCount)}
                  />
                  <DetailTag
                    label="Mascotas"
                    value={String(apartment.profile.petCount)}
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

export function AdminCensusDashboard() {
  const [selectedDate, setSelectedDate] = useState(getTodayInCaracas());
  const [data, setData] = useState<CensusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    async function loadCensus() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/census?date=${selectedDate}`,
        );
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error ?? "No se pudo cargar el censo.");
          setData(null);
          return;
        }

        setData(payload);
      } catch {
        setError("Error de conexión al cargar el censo.");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadCensus();
  }, [selectedDate]);

  useEffect(() => {
    setCopyState("idle");
  }, [selectedDate, data]);

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
      <header className="page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="page-eyebrow">Administración</p>
          <h1 className="page-title mt-2">Censo diario</h1>
          <p className="page-subtitle">Vista por torres y pisos</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label htmlFor="census-date" className="field-label">
              Fecha
            </label>
            <input
              id="census-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="field-input"
            />
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!data || isLoading}
            className="btn-ghost"
          >
            Exportar
          </button>

          <button
            type="button"
            onClick={handleCopyResults}
            disabled={!data || isLoading}
            className="btn-ghost"
          >
            {copyState === "copied"
              ? "Copiado"
              : copyState === "error"
                ? "No se pudo copiar"
                : "Copiar resultados"}
          </button>
        </div>
      </header>

      {data && (
        <div className="space-y-4">
          <div className="stats-bar">
            {[
              { label: "Apartamentos", value: data.totals.apartments },
              { label: "Respondieron", value: data.totals.answered },
              { label: "Pernoctan", value: data.totals.staying },
              { label: "Personas", value: data.totals.people },
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

      {error && <div className="alert-error">{error}</div>}

      {isLoading ? (
        <div className="app-card py-16 text-center text-sm text-stone-400">
          Cargando censo…
        </div>
      ) : (
        <div className="admin-tower-grid">
          {data?.towers.map((tower) => (
            <section
              key={tower.code}
              className="overflow-hidden rounded-xl border border-stone-200/60 bg-white"
            >
              <div className="border-b border-stone-100 px-5 py-3.5">
                <h2 className="section-title text-base">Torre {tower.code}</h2>
              </div>

              <div className="divide-y divide-stone-100">
                {tower.floors.map((floor) => (
                  <div key={floor.label} className="px-5 py-4">
                    <h3 className="mb-3 text-[11px] font-semibold tracking-wide text-stone-400 uppercase">
                      {floor.label}
                    </h3>
                    <div className="admin-apt-list">
                      {floor.apartments.map((apartment) => (
                        <AdminApartmentRow
                          key={apartment.id}
                          apartment={apartment}
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
