"use client";

import { useEffect, useState } from "react";
import {
  buildCensusCopyText,
  copyTextToClipboard,
} from "@/lib/census/copy-results";
import { formatDateInCaracas, getTodayInCaracas } from "@/lib/dates";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title mt-0">Censo diario</h1>
          <p className="page-subtitle">Vista administrativa por torres y pisos</p>
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
            onClick={handleCopyResults}
            disabled={!data || isLoading}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copyState === "copied"
              ? "Copiado"
              : copyState === "error"
                ? "No se pudo copiar"
                : "Copiar resultados"}
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Apartamentos", value: data.totals.apartments },
              { label: "Respondieron", value: data.totals.answered },
              { label: "Pernoctan", value: data.totals.staying },
              { label: "Personas", value: data.totals.people },
            ].map((stat) => (
              <div key={stat.label} className="stat-card">
                <p className="text-xs font-medium tracking-wide text-stone-400 uppercase">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        </>
      )}

      {error && <div className="alert-error">{error}</div>}

      {isLoading ? (
        <div className="app-card py-16 text-center text-sm text-stone-400">
          Cargando censo…
        </div>
      ) : (
        data?.towers.map((tower) => (
          <section
            key={tower.code}
            className="overflow-hidden rounded-xl border border-stone-200/60 bg-white"
          >
            <div className="border-b border-stone-100 px-5 py-3.5">
              <h2 className="section-title">Torre {tower.code}</h2>
            </div>

            <div className="divide-y divide-stone-100">
              {tower.floors.map((floor) => (
                <div key={floor.label} className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-semibold tracking-wide text-stone-400 uppercase">
                    {floor.label}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {floor.apartments.map((apartment) => (
                      <div
                        key={apartment.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 bg-stone-50/50 px-3 py-2.5"
                      >
                        <span className="text-sm font-medium text-stone-800">
                          {apartment.code}
                        </span>
                        <CensusBadge apartment={apartment} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
