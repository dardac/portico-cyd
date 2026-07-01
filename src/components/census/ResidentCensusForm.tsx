"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApartmentProfileSection,
  type ApartmentProfileSectionHandle,
} from "@/components/apartment/ApartmentProfileSection";
import { formatDateInCaracas } from "@/lib/dates";
import {
  limitCountInput,
  limitOccupantNamesInput,
  MAX_OCCUPANT_NAMES_LENGTH,
} from "@/lib/validators";

type CensusEntry = {
  willStayOvernight: boolean;
  adultCount: number | null;
  childrenCount: number | null;
  occupantNames: string | null;
  hasDisability: boolean | null;
  disabilityType: string | null;
  vehicleCount: number | null;
  petCount: number | null;
  updatedAt: string;
};

function applyCensusEntry(
  entry: CensusEntry,
  setters: {
    setWillStay: (value: boolean) => void;
    setAdultCount: (value: string) => void;
    setChildrenCount: (value: string) => void;
    setOccupantNames: (value: string) => void;
    setHasDisability: (value: boolean | null) => void;
    setDisabilityType: (value: string) => void;
    setVehicleCount: (value: string) => void;
    setPetCount: (value: string) => void;
  },
) {
  setters.setWillStay(entry.willStayOvernight);
  setters.setAdultCount(
    entry.adultCount !== null ? String(entry.adultCount) : "",
  );
  setters.setChildrenCount(
    entry.childrenCount !== null ? String(entry.childrenCount) : "",
  );
  setters.setOccupantNames(entry.occupantNames ?? "");
  setters.setHasDisability(entry.hasDisability);
  setters.setDisabilityType(entry.disabilityType ?? "");
  setters.setVehicleCount(
    entry.vehicleCount !== null ? String(entry.vehicleCount) : "0",
  );
  setters.setPetCount(entry.petCount !== null ? String(entry.petCount) : "0");
}

function clearOvernightFields(setters: {
  setAdultCount: (value: string) => void;
  setChildrenCount: (value: string) => void;
  setOccupantNames: (value: string) => void;
  setHasDisability: (value: boolean | null) => void;
  setDisabilityType: (value: string) => void;
  setVehicleCount: (value: string) => void;
  setPetCount: (value: string) => void;
}) {
  setters.setAdultCount("");
  setters.setChildrenCount("");
  setters.setOccupantNames("");
  setters.setHasDisability(null);
  setters.setDisabilityType("");
  setters.setVehicleCount("0");
  setters.setPetCount("0");
}

export function ResidentCensusForm() {
  const profileRef = useRef<ApartmentProfileSectionHandle>(null);
  const [censusDate, setCensusDate] = useState("");
  const [willStay, setWillStay] = useState<boolean | null>(null);
  const [adultCount, setAdultCount] = useState("");
  const [childrenCount, setChildrenCount] = useState("");
  const [occupantNames, setOccupantNames] = useState("");
  const [occupation, setOccupation] = useState("");
  const [hasDisability, setHasDisability] = useState<boolean | null>(null);
  const [disabilityType, setDisabilityType] = useState("");
  const [vehicleCount, setVehicleCount] = useState("0");
  const [petCount, setPetCount] = useState("0");
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [prefillFromDate, setPrefillFromDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const overnightSetters = {
    setAdultCount,
    setChildrenCount,
    setOccupantNames,
    setHasDisability,
    setDisabilityType,
    setVehicleCount,
    setPetCount,
  };

  useEffect(() => {
    async function loadCensus() {
      try {
        const todayResponse = await fetch("/api/census/today");
        const data = await todayResponse.json();

        if (!todayResponse.ok) {
          setError(data.error ?? "No se pudo cargar el censo.");
          return;
        }

        setCensusDate(data.censusDate);

        if (data.entry) {
          applyCensusEntry(data.entry, {
            setWillStay,
            ...overnightSetters,
          });
          setIsPrefilled(false);
          setPrefillFromDate(null);
        } else if (data.prefill) {
          applyCensusEntry(data.prefill, {
            setWillStay,
            ...overnightSetters,
          });
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
  }, []);

  function markEdited() {
    setSuccess(false);
    if (isPrefilled) setIsPrefilled(false);
  }

  function validateCensusFields(): string | null {
    if (willStay === null) {
      return "Selecciona si pernoctarás hoy en el edificio.";
    }

    if (!willStay) return null;

    const adults = Number(adultCount || "0");
    const children = Number(childrenCount || "0");

    if (adults + children < 1) {
      return "Indica cuántos adultos y niños/adolescentes pernoctarán (al menos 1 en total).";
    }

    if (!occupantNames.trim()) {
      return "Indica los nombres de los ocupantes que pernoctarán.";
    }

    if (occupantNames.length > MAX_OCCUPANT_NAMES_LENGTH) {
      return "Los nombres de los ocupantes son demasiado largos.";
    }

    if (!occupation.trim()) {
      return "Indica la ocupación de los ocupantes del apartamento.";
    }

    if (hasDisability === null) {
      return "Indica si algún ocupante posee discapacidad.";
    }

    if (hasDisability && !disabilityType.trim()) {
      return "Indica qué tipo de discapacidad presenta.";
    }

    return null;
  }

  async function handleGlobalSave() {
    setError(null);
    setSuccess(false);

    const validationError = validateCensusFields();
    if (validationError) {
      setError(validationError);
      window.requestAnimationFrame(() => {
        document
          .querySelector("[data-census-error]")
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      return;
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
          occupantNames: willStay ? occupantNames.trim() : undefined,
          hasDisability: willStay ? hasDisability : undefined,
          disabilityType:
            willStay && hasDisability ? disabilityType.trim() : null,
          vehicleCount: willStay ? Number(vehicleCount || "0") : undefined,
          petCount: willStay ? Number(petCount || "0") : undefined,
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

      {error && (
        <div role="alert" className="alert-error mb-6" data-census-error>
          {error}
        </div>
      )}

      {isPrefilled && prefillFromDate && (
        <div className="alert-info mb-6">
          Respuesta del {formatDateInCaracas(prefillFromDate)} autocompletada.
          Revísala y guarda si es correcta, o edítala si cambió.
        </div>
      )}

      {success && (
        <div role="status" className="alert-success mb-6">
          Cambios guardados correctamente.
        </div>
      )}

      <div className="page-layout-main">
        <ApartmentProfileSection
          ref={profileRef}
          variant="sidebar"
          integration="combined"
          hideOccupationField
          requireOccupation={willStay === true}
          occupationValue={willStay ? occupation : undefined}
          onOccupationChange={setOccupation}
          onProfileLoaded={({ occupation: loadedOccupation }) =>
            setOccupation(loadedOccupation)
          }
        />
        <div className="app-card-compact census-form w-full">
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
                        clearOvernightFields(overnightSetters);
                      }
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {willStay && (
            <div className="census-followup space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
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
              </div>

              <p className="field-hint">
                Al menos 1 persona en total (adulto o niño/adolescente).
              </p>

              <div>
                <label htmlFor="occupantNames" className="field-label">
                  Nombres de los ocupantes
                </label>
                <textarea
                  id="occupantNames"
                  rows={3}
                  maxLength={MAX_OCCUPANT_NAMES_LENGTH}
                  value={occupantNames}
                  onChange={(event) => {
                    setOccupantNames(
                      limitOccupantNamesInput(event.target.value),
                    );
                    markEdited();
                  }}
                  className="field-input resize-y"
                  placeholder="Ej. María González, Juan Pérez, Ana Rodríguez…"
                />
                <p className="field-hint">
                  Máximo {MAX_OCCUPANT_NAMES_LENGTH} caracteres.
                </p>
              </div>

              <div>
                <label htmlFor="occupation" className="field-label">
                  Ocupación o profesión de los ocupantes del apartamento
                </label>
                <textarea
                  id="occupation"
                  rows={3}
                  value={occupation}
                  onChange={(event) => {
                    setOccupation(event.target.value);
                    markEdited();
                  }}
                  className="field-input resize-y"
                  placeholder="Ej. médico, estudiante, jubilado…"
                />
              </div>

              <fieldset>
                <legend className="field-label mb-3">
                  ¿Algún ocupante posee discapacidad?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: true, label: "Sí" },
                    { value: false, label: "No" },
                  ].map((option) => (
                    <label
                      key={String(option.value)}
                      className={`choice-card ${
                        hasDisability === option.value
                          ? "choice-card-active"
                          : "choice-card-inactive"
                      }`}
                    >
                      <input
                        type="radio"
                        name="hasDisability"
                        className="sr-only"
                        checked={hasDisability === option.value}
                        onChange={() => {
                          setHasDisability(option.value);
                          if (!option.value) setDisabilityType("");
                          markEdited();
                        }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {hasDisability && (
                <div>
                  <label htmlFor="disabilityType" className="field-label">
                    ¿Qué tipo de discapacidad presenta?
                  </label>
                  <input
                    id="disabilityType"
                    type="text"
                    value={disabilityType}
                    onChange={(event) => {
                      setDisabilityType(event.target.value);
                      markEdited();
                    }}
                    className="field-input"
                    placeholder="Ej. visual, motriz, auditiva…"
                  />
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="vehicleCount" className="field-label">
                    Cantidad de vehículos
                  </label>
                  <input
                    id="vehicleCount"
                    type="text"
                    inputMode="numeric"
                    value={vehicleCount}
                    onChange={(event) => {
                      setVehicleCount(limitCountInput(event.target.value));
                      markEdited();
                    }}
                    className="field-input"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="petCount" className="field-label">
                    Cantidad de mascotas
                  </label>
                  <input
                    id="petCount"
                    type="text"
                    inputMode="numeric"
                    value={petCount}
                    onChange={(event) => {
                      setPetCount(limitCountInput(event.target.value));
                      markEdited();
                    }}
                    className="field-input"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="page-aside" />
      </div>

      <div className="save-bar">
        <p className="mb-3 text-xs text-stone-500">
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
