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
      <div className="app-card py-16 text-center text-sm text-stone-400">
        Cargando censo de hoy…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="page-title mt-0">Censo diario</h1>
        {censusDate && (
          <p className="page-subtitle">{formatDateInCaracas(censusDate)}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="app-card space-y-6">
        {error && <div className="alert-error">{error}</div>}

        {isPrefilled && prefillFromDate && (
          <div className="alert-info">
            Respuesta del {formatDateInCaracas(prefillFromDate)} autocompletada.
            Revísala y guarda si es correcta, o edítala si cambió.
          </div>
        )}

        {success && (
          <div className="alert-success">
            Respuesta guardada. Puedes editarla cuando quieras hoy.
          </div>
        )}

        <fieldset>
          <legend className="text-sm font-medium text-stone-800">
            ¿Pernoctará en el día de hoy en las residencias?
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { value: true, label: "Sí" },
              { value: false, label: "No" },
            ].map((option) => (
              <label
                key={String(option.value)}
                className={`choice-card ${
                  willStay === option.value
                    ? "choice-card-active"
                    : "choice-card-inactive"
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
            <label htmlFor="peopleCount" className="field-label">
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
              className="field-input"
              placeholder="Ej. 3"
            />
            <p className="field-hint">Mínimo 1 persona, máximo 999.</p>
          </div>
        )}

        <button type="submit" disabled={isSaving} className="btn-primary">
          {isSaving
            ? "Guardando…"
            : isPrefilled
              ? "Confirmar respuesta"
              : "Guardar respuesta"}
        </button>
      </form>

      <section className="app-card">
        <h2 className="section-title">Tu historial</h2>
        <p className="mt-1 text-sm text-stone-500">
          Solo puedes ver las respuestas de tu apartamento.
        </p>

        {history.length === 0 ? (
          <p className="mt-6 text-sm text-stone-400">
            Aún no tienes días anteriores registrados.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-stone-100">
            {history.map((entry) => (
              <li
                key={entry.censusDate}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <p className="text-sm font-medium text-stone-800">
                  {formatDateInCaracas(entry.censusDate, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <span className="text-sm text-stone-500">
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
