"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { formatDateInCaracas } from "@/lib/dates";

type CensusEntry = {
  willStayOvernight: boolean;
  peopleCount: number | null;
  updatedAt: string;
};

type HistoryEntry = CensusEntry & {
  censusDate: string;
};

function formatResponse(entry: Pick<HistoryEntry, "willStayOvernight" | "peopleCount">) {
  if (!entry.willStayOvernight) return "No pernocta";
  return `Sí · ${entry.peopleCount} ${entry.peopleCount === 1 ? "persona" : "personas"}`;
}

export function ResidentCensusForm() {
  const [censusDate, setCensusDate] = useState("");
  const [willStay, setWillStay] = useState<boolean | null>(null);
  const [peopleCount, setPeopleCount] = useState("");
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [prefillFromDate, setPrefillFromDate] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadHistory = useCallback(async () => {
    const response = await fetch("/api/census/history");
    const data = await response.json();

    if (response.ok) {
      setHistory(data.entries ?? []);
    }
  }, []);

  useEffect(() => {
    async function loadCensus() {
      try {
        const [todayResponse] = await Promise.all([
          fetch("/api/census/today"),
          loadHistory(),
        ]);
        const data = await todayResponse.json();

        if (!todayResponse.ok) {
          setError(data.error ?? "No se pudo cargar el censo.");
          return;
        }

        setCensusDate(data.censusDate);

        if (data.entry) {
          setWillStay(data.entry.willStayOvernight);
          setPeopleCount(
            data.entry.peopleCount ? String(data.entry.peopleCount) : "",
          );
          setIsPrefilled(false);
          setPrefillFromDate(null);
        } else if (data.prefill) {
          setWillStay(data.prefill.willStayOvernight);
          setPeopleCount(
            data.prefill.peopleCount ? String(data.prefill.peopleCount) : "",
          );
          setIsPrefilled(true);
          setPrefillFromDate(data.prefill.fromDate);
        }
      } catch {
        setError("Error de conexión al cargar el censo.");
      } finally {
        setIsLoading(false);
      }
    }

    loadCensus();
  }, [loadHistory]);

  function markEdited() {
    setSuccess(false);
    if (isPrefilled) setIsPrefilled(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (willStay === null) {
      setError("Selecciona si pernoctarás hoy en el edificio.");
      return;
    }

    if (willStay && (!peopleCount || Number(peopleCount) < 1)) {
      setError("Indica cuántas personas pernoctarán (mínimo 1).");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/census/today", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          willStayOvernight: willStay,
          peopleCount: willStay ? Number(peopleCount) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar el censo.");
        return;
      }

      setCensusDate(data.censusDate);
      setIsPrefilled(false);
      setPrefillFromDate(null);
      setSuccess(true);
      await loadHistory();
    } catch {
      setError("Error de conexión al guardar el censo.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">
        Cargando censo de hoy…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Censo diario</h1>
        {censusDate && (
          <p className="mt-1 text-sm text-stone-600">
            {formatDateInCaracas(censusDate)}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isPrefilled && prefillFromDate && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Respuesta del {formatDateInCaracas(prefillFromDate)} autocompletada.
            Revísala y guarda si es correcta, o edítala si cambió.
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Respuesta guardada. Puedes editarla cuando quieras hoy.
          </div>
        )}

        <fieldset>
          <legend className="text-base font-medium text-stone-900">
            ¿Pernoctará en el día de hoy en las residencias?
          </legend>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { value: true, label: "Sí" },
              { value: false, label: "No" },
            ].map((option) => (
              <label
                key={String(option.value)}
                className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  willStay === option.value
                    ? "border-amber-700 bg-amber-50 text-amber-900"
                    : "border-stone-200 text-stone-700 hover:border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="willStay"
                  className="sr-only"
                  checked={willStay === option.value}
                  onChange={() => {
                    setWillStay(option.value);
                    markEdited();
                    if (!option.value) setPeopleCount("");
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {willStay && (
          <div>
            <label
              htmlFor="peopleCount"
              className="mb-1.5 block text-sm font-medium text-stone-700"
            >
              ¿Cuántas personas pernoctarán?
            </label>
            <input
              id="peopleCount"
              type="text"
              inputMode="numeric"
              pattern="[1-9][0-9]{0,2}"
              required
              value={peopleCount}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
                if (digits === "0") return;
                setPeopleCount(digits);
                markEdited();
              }}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-base shadow-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
              placeholder="Ej. 3"
            />
            <p className="mt-1.5 text-sm text-stone-500">
              Mínimo 1 persona, máximo 999.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-amber-800 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-amber-900 disabled:opacity-70"
        >
          {isSaving ? "Guardando…" : isPrefilled ? "Confirmar respuesta" : "Guardar respuesta"}
        </button>
      </form>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-stone-900">Tu historial</h2>
        <p className="mt-1 text-sm text-stone-600">
          Solo puedes ver las respuestas de tu apartamento.
        </p>

        {history.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">
            Aún no tienes días anteriores registrados.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-stone-100">
            {history.map((entry) => (
              <li
                key={entry.censusDate}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {formatDateInCaracas(entry.censusDate, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-stone-600">
                  {formatResponse(entry)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
