"use client";

import { useEffect, useState } from "react";
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
    return (
      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
        Sin respuesta
      </span>
    );
  }

  if (!apartment.census.willStayOvernight) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
        No pernocta
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Censo diario</h1>
          <p className="mt-1 text-sm text-stone-600">
            Vista administrativa por torres y pisos
          </p>
        </div>

        <div>
          <label
            htmlFor="census-date"
            className="mb-1.5 block text-sm font-medium text-stone-700"
          >
            Fecha
          </label>
          <input
            id="census-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
          />
        </div>
      </div>

      {data && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Apartamentos", value: data.totals.apartments },
            { label: "Respondieron", value: data.totals.answered },
            { label: "Pernoctan", value: data.totals.staying },
            { label: "Personas", value: data.totals.people },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-stone-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {data && (
        <p className="text-sm text-stone-600">
          {formatDateInCaracas(data.censusDate)}
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          Cargando censo…
        </div>
      ) : (
        data?.towers.map((tower) => (
          <section
            key={tower.code}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="border-b border-stone-200 bg-stone-50 px-5 py-4">
              <h2 className="text-lg font-semibold text-stone-900">
                Torre {tower.code}
              </h2>
            </div>

            <div className="divide-y divide-stone-100">
              {tower.floors.map((floor) => (
                <div key={floor.label} className="px-5 py-4">
                  <h3 className="mb-3 text-sm font-semibold text-amber-900">
                    {floor.label}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {floor.apartments.map((apartment) => (
                      <div
                        key={apartment.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-3"
                      >
                        <span className="text-sm font-medium text-stone-900">
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
