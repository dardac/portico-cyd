"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type FormEvent,
} from "react";
import { formatDateInCaracas } from "@/lib/dates";

type ProfileEntry = {
  occupation: string;
  hasDisability: boolean;
  disabilityType: string | null;
  vehicleCount: number;
  petCount: number;
  updatedAt: string;
};

type ProfilePrefill = ProfileEntry & {
  fromDate: string;
};

export type ApartmentProfileSectionHandle = {
  shouldSave: () => boolean;
  validateAndSave: () => Promise<{ ok: true } | { ok: false; error: string }>;
};

function limitCountInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="profile-tile">
      <dt className="profile-tile-label">{label}</dt>
      <dd className="profile-tile-value">{value}</dd>
    </div>
  );
}

function applyEntryToForm(
  entry: ProfileEntry,
  setters: {
    setOccupation: (value: string) => void;
    setHasDisability: (value: boolean | null) => void;
    setDisabilityType: (value: string) => void;
    setVehicleCount: (value: string) => void;
    setPetCount: (value: string) => void;
  },
) {
  setters.setOccupation(entry.occupation);
  setters.setHasDisability(entry.hasDisability);
  setters.setDisabilityType(entry.disabilityType ?? "");
  setters.setVehicleCount(String(entry.vehicleCount));
  setters.setPetCount(String(entry.petCount));
}

type ApartmentProfileSectionProps = {
  variant?: "default" | "sidebar";
  integration?: "standalone" | "combined";
};

export const ApartmentProfileSection = forwardRef<
  ApartmentProfileSectionHandle,
  ApartmentProfileSectionProps
>(function ApartmentProfileSection(
  { variant = "default", integration = "standalone" },
  ref,
) {
  const isCombined = integration === "combined";
  const [profileDate, setProfileDate] = useState("");
  const [entry, setEntry] = useState<ProfileEntry | null>(null);
  const [prefill, setPrefill] = useState<ProfilePrefill | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [hasDisability, setHasDisability] = useState<boolean | null>(null);
  const [disabilityType, setDisabilityType] = useState("");
  const [vehicleCount, setVehicleCount] = useState("0");
  const [petCount, setPetCount] = useState("0");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formSetters = {
    setOccupation,
    setHasDisability,
    setDisabilityType,
    setVehicleCount,
    setPetCount,
  };

  const displayEntry = entry ?? prefill;
  const hasDisplayData = Boolean(displayEntry);
  const isPrefilled = Boolean(prefill) && !isSaved;

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/apartment/profile");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "No se pudieron cargar los datos.");
          return;
        }

        setProfileDate(data.profileDate);
        setEntry(data.entry);
        setPrefill(data.prefill);
        setIsSaved(data.isSaved);

        if (data.entry) {
          applyEntryToForm(data.entry, formSetters);
          setIsEditing(false);
        } else if (data.prefill) {
          applyEntryToForm(data.prefill, formSetters);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch {
        setError("Error de conexión al cargar los datos del apartamento.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  function resetFormToDisplayData() {
    if (entry) {
      applyEntryToForm(entry, formSetters);
    } else if (prefill) {
      applyEntryToForm(prefill, formSetters);
    }
  }

  function validateFormFields():
    | { ok: true; body: Record<string, unknown> }
    | { ok: false; error: string } {
    if (!occupation.trim()) {
      return {
        ok: false,
        error: "Indica la ocupación de los ocupantes del apartamento.",
      };
    }

    if (hasDisability === null) {
      return {
        ok: false,
        error: "Indica si algún ocupante posee discapacidad.",
      };
    }

    if (hasDisability && !disabilityType.trim()) {
      return {
        ok: false,
        error: "Indica qué tipo de discapacidad presenta.",
      };
    }

    return {
      ok: true,
      body: {
        occupation,
        hasDisability,
        disabilityType: hasDisability ? disabilityType : null,
        vehicleCount: Number(vehicleCount || "0"),
        petCount: Number(petCount || "0"),
      },
    };
  }

  function payloadFromEntry(source: ProfileEntry) {
    return {
      occupation: source.occupation,
      hasDisability: source.hasDisability,
      disabilityType: source.disabilityType,
      vehicleCount: source.vehicleCount,
      petCount: source.petCount,
    };
  }

  async function persistProfile(
    body: Record<string, unknown>,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    setIsSaving(true);

    try {
      const response = await fetch("/api/apartment/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          error: data.error ?? "No se pudieron guardar los datos del apartamento.",
        };
      }

      setProfileDate(data.profileDate);
      setEntry(data.entry);
      setPrefill(null);
      setIsSaved(true);
      if (data.entry) applyEntryToForm(data.entry, formSetters);
      setIsEditing(false);
      setSuccess(true);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Error de conexión al guardar los datos del apartamento.",
      };
    } finally {
      setIsSaving(false);
    }
  }

  useImperativeHandle(ref, () => ({
    shouldSave: () => isEditing || !isSaved,
    validateAndSave: async () => {
      setError(null);
      setSuccess(false);

      if (isEditing) {
        const validated = validateFormFields();
        if (!validated.ok) return validated;
        return persistProfile(validated.body);
      }

      if (!isSaved && prefill) {
        return persistProfile(payloadFromEntry(prefill));
      }

      if (!isSaved) {
        const validated = validateFormFields();
        if (!validated.ok) return validated;
        return persistProfile(validated.body);
      }

      return { ok: true };
    },
  }));

  async function handleStandaloneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const validated = validateFormFields();
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    const result = await persistProfile(validated.body);
    if (!result.ok) {
      setError(result.error);
    }
  }

  if (isLoading) {
    return (
      <section
        className={
          variant === "sidebar"
            ? "app-card-compact py-10 text-center text-sm text-stone-400"
            : "app-card py-10 text-center text-sm text-stone-400"
        }
      >
        Cargando datos del apartamento…
      </section>
    );
  }

  const cardClass = variant === "sidebar" ? "app-card-compact" : "app-card";
  const showLocalFeedback = !isCombined;

  return (
    <section className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            className={
              variant === "sidebar" ? "section-title text-base" : "section-title"
            }
          >
            Tu apartamento
          </h2>
          {variant === "default" && profileDate && (
            <p className="mt-1.5 text-sm text-stone-500">
              Datos de hoy · {formatDateInCaracas(profileDate)}
            </p>
          )}
        </div>

        {!isEditing && hasDisplayData && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setSuccess(false);
              setError(null);
            }}
            className="btn-ghost shrink-0 gap-1.5 px-2.5"
            aria-label="Editar datos del apartamento"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="m2.695 14.763-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
            </svg>
            Editar
          </button>
        )}
      </div>

      {showLocalFeedback && error && (
        <div className="alert-error mt-4">{error}</div>
      )}

      {!isEditing && isPrefilled && prefill && (
        <div className="alert-info mt-4">
          Datos del {formatDateInCaracas(prefill.fromDate)} listos para hoy.
          Confírmalos o edítalos si algo cambió.
        </div>
      )}

      {showLocalFeedback && success && !isEditing && (
        <div className="alert-success mt-4">
          Datos guardados correctamente.
        </div>
      )}

      {isEditing ? (
        <div className="mt-5 space-y-4">
          {isPrefilled && prefill && (
            <div className="alert-info">
              Datos del {formatDateInCaracas(prefill.fromDate)} autocompletados.
              Revísalos antes de guardar, o edítalos si cambió algo.
            </div>
          )}

          <div>
            <label htmlFor="occupation" className="field-label">
              Ocupación de los ocupantes del apartamento
            </label>
            <textarea
              id="occupation"
              rows={3}
              value={occupation}
              onChange={(event) => setOccupation(event.target.value)}
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
                onChange={(event) => setDisabilityType(event.target.value)}
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
                onChange={(event) =>
                  setVehicleCount(limitCountInput(event.target.value))
                }
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
                onChange={(event) =>
                  setPetCount(limitCountInput(event.target.value))
                }
                className="field-input"
                placeholder="0"
              />
            </div>
          </div>

          {isCombined && hasDisplayData && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                resetFormToDisplayData();
                setIsEditing(false);
                setError(null);
              }}
              className="text-sm font-medium text-stone-400 underline decoration-stone-300 underline-offset-2 transition hover:text-stone-600 hover:decoration-stone-400"
            >
              Cancelar edición
            </button>
          )}

          {!isCombined && (
            <form onSubmit={handleStandaloneSubmit} className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary sm:flex-1"
              >
                {isSaving
                  ? "Guardando…"
                  : isPrefilled
                    ? "Confirmar datos"
                    : "Guardar datos"}
              </button>
              {hasDisplayData && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    resetFormToDisplayData();
                    setIsEditing(false);
                    setError(null);
                  }}
                  className="btn-ghost sm:flex-1"
                >
                  Cancelar
                </button>
              )}
            </form>
          )}
        </div>
      ) : (
        displayEntry && (
          <dl className="mt-5 grid grid-cols-2 gap-2">
            <ProfileField
              label="Ocupación"
              value={displayEntry.occupation}
            />
            <ProfileField
              label="Discapacidad"
              value={
                displayEntry.hasDisability
                  ? displayEntry.disabilityType
                    ? `Sí · ${displayEntry.disabilityType}`
                    : "Sí"
                  : "No"
              }
            />
            <ProfileField
              label="Vehículos"
              value={String(displayEntry.vehicleCount)}
            />
            <ProfileField
              label="Mascotas"
              value={String(displayEntry.petCount)}
            />
          </dl>
        )
      )}
    </section>
  );
});
