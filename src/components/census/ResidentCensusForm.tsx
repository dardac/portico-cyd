"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApartmentProfileSection,
  type ApartmentProfileSectionHandle,
} from "@/components/apartment/ApartmentProfileSection";
import { formatCensusPeople } from "@/lib/census/format-people";
import { formatDateInCaracas } from "@/lib/dates";

type CensusEntry = {
  willStayOvernight: boolean;
  adultCount: number | null;
  childrenCount: number | null;
  updatedAt: string;
};

type HistoryEntry = CensusEntry & {
  censusDate: string;
};

function formatResponse(
  entry: Pick<HistoryEntry, "willStayOvernight" | "adultCount" | "childrenCount">,
) {
  if (!entry.willStayOvernight) return "No pernocta";
  return `Sí · ${formatCensusPeople({
    adultCount: entry.adultCount ?? 0,
    childrenCount: entry.childrenCount ?? 0,
  })}`;
}

function limitCountInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

export function ResidentCensusForm() {
  const profileRef = useRef<ApartmentProfileSectionHandle>(null);
  const [censusDate, setCensusDate] = useState("");
  const [willStay, setWillStay] = useState<boolean | null>(null);
  const [adultCount, setAdultCount] = useState("");
  const [childrenCount, setChildrenCount] = useState("");
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
          setAdultCount(
            data.entry.adultCount !== null ? String(data.entry.adultCount) : "",
          );
          setChildrenCount(
            data.entry.childrenCount !== null
              ? String(data.entry.childrenCount)
              : "",
          );
          setIsPrefilled(false);
          setPrefillFromDate(null);
        } else if (data.prefill) {
          setWillStay(data.prefill.willStayOvernight);
          setAdultCount(
            data.prefill.adultCount !== null
              ? String(data.prefill.adultCount)
              : "",
          );
          setChildrenCount(
            data.prefill.childrenCount !== null
              ? String(data.prefill.childrenCount)
              : "",
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

  async function handleGlobalSave() {
    setError(null);
    setSuccess(false);

    if (willStay === null) {
      setError("Selecciona si pernoctarás hoy en el edificio.");
      return;
    }

    if (willStay) {
      const adults = Number(adultCount || "0");
      const children = Number(childrenCount || "0");

      if (adults + children < 1) {
        setError(
          "Indica cuántos adultos y niños/adolescentes pernoctarán (al menos 1 en total).",
        );
        return;
      }
    }

    setIsSaving(true);

    try {
      if (profileRef.current?.shouldSave()) {
        const profileResult = await profileRef.current.validateAndSave();
        if (!profileResult.ok) {
          setError(profileResult.error);
          return;
        }
      }

      const response = await fetch("/api/census/today", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          willStayOvernight: willStay,
          adultCount: willStay ? Number(adultCount || "0") : null,
          childrenCount: willStay ? Number(childrenCount || "0") : null,
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
      setError("Error de conexión al guardar. Intenta de nuevo.");
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
    <div className="page-content">
      <header className="page-header">
        <p className="page-eyebrow">Hoy</p>
        <h1 className="page-title mt-2">Censo diario</h1>
        {censusDate && (
          <p className="page-subtitle">{formatDateInCaracas(censusDate)}</p>
        )}
      </header>

      {error && <div className="alert-error mb-6">{error}</div>}

      {isPrefilled && prefillFromDate && (
        <div className="alert-info mb-6">
          Respuesta del {formatDateInCaracas(prefillFromDate)} autocompletada.
          Revísala y guarda si es correcta, o edítala si cambió.
        </div>
      )}

      {success && (
        <div className="alert-success mb-6">
          Cambios guardados correctamente.
        </div>
      )}

      <div className="page-layout-main">
        <div className="app-card census-form">
          <fieldset className="space-y-4">
            <legend className="census-legend">
              ¿Pernoctará en el día de hoy en las residencias?
            </legend>
            <div className="grid grid-cols-2 gap-2.5">
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
                      if (!option.value) {
                        setAdultCount("");
                        setChildrenCount("");
                      }
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {willStay && (
            <div className="census-followup grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="adultCount" className="field-label">
                  Número de adultos
                </label>
                <input
                  id="adultCount"
                  type="text"
                  inputMode="numeric"
                  value={adultCount}
                  onChange={(event) => {
                    setAdultCount(limitCountInput(event.target.value));
                    markEdited();
                  }}
                  className="field-input max-w-[8rem]"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="childrenCount" className="field-label">
                  Número de niños o adolescentes
                </label>
                <input
                  id="childrenCount"
                  type="text"
                  inputMode="numeric"
                  value={childrenCount}
                  onChange={(event) => {
                    setChildrenCount(limitCountInput(event.target.value));
                    markEdited();
                  }}
                  className="field-input max-w-[8rem]"
                  placeholder="0"
                />
              </div>

              <p className="field-hint sm:col-span-2">
                Al menos 1 persona en total (adulto o niño/adolescente). Máximo
                999 por categoría.
              </p>
            </div>
          )}
        </div>

        <aside className="page-aside">
          <ApartmentProfileSection
            ref={profileRef}
            variant="sidebar"
            integration="combined"
          />

          {/* <section className="app-card-compact">
            <h2 className="section-title text-base">Historial</h2>
            <p className="mt-1 text-xs text-stone-400">
              Respuestas anteriores de tu apartamento.
            </p>

            {history.length === 0 ? (
              <p className="mt-5 text-sm text-stone-400">
                Aún no hay días registrados.
              </p>
            ) : (
              <ul className="mt-4 space-y-0.5">
                {history.map((entry) => (
                  <li key={entry.censusDate} className="history-row">
                    <p className="text-sm text-stone-700">
                      {formatDateInCaracas(entry.censusDate, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <span className="shrink-0 text-xs text-stone-400">
                      {formatResponse(entry)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section> */}
        </aside>
      </div>

      <div className="save-bar">
        <p className="mb-3 text-xs text-stone-400">
          Guarda el censo de hoy y los datos de tu apartamento.
        </p>
        <button
          type="button"
          onClick={handleGlobalSave}
          disabled={isSaving}
          className="btn-save-global"
        >
          {isSaving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
