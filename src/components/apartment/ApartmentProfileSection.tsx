"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useState,
  type FormEvent,
} from "react";
import { formatDateInCaracas } from "@/lib/dates";
import {
  getInfrastructureStatusLabel,
  INFRASTRUCTURE_STATUS_OPTIONS,
  type InfrastructureStatus,
} from "@/lib/apartment/infrastructure-status";
import { getPipeStatusLabel, type PipeStatus } from "@/lib/apartment/pipe-status";
import { PipeStatusSelector } from "@/components/apartment/PipeStatusSelector";
import { exceedsMaxLength, isValidPhone, MAX_TEXT_FIELD_LENGTH } from "@/lib/validators";

type ProfileEntry = {
  occupation: string;
  infrastructureStatus: InfrastructureStatus | null;
  gasPipeStatus: PipeStatus | null;
  waterPipeStatus: PipeStatus | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  updatedAt: string;
};

type ProfilePrefill = ProfileEntry & {
  fromDate: string;
};

export type ApartmentProfileSectionHandle = {
  shouldSave: () => boolean;
  validateAndSave: () => Promise<{ ok: true } | { ok: false; error: string }>;
};

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
    setInfrastructureStatus: (value: InfrastructureStatus | null) => void;
    setGasPipeStatus: (value: PipeStatus | null) => void;
    setWaterPipeStatus: (value: PipeStatus | null) => void;
    setEmergencyContactName: (value: string) => void;
    setEmergencyContactPhone: (value: string) => void;
  },
) {
  setters.setOccupation(entry.occupation);
  setters.setInfrastructureStatus(entry.infrastructureStatus);
  setters.setGasPipeStatus(entry.gasPipeStatus);
  setters.setWaterPipeStatus(entry.waterPipeStatus);
  setters.setEmergencyContactName(entry.emergencyContactName ?? "");
  setters.setEmergencyContactPhone(entry.emergencyContactPhone ?? "");
}

type ApartmentProfileSectionProps = {
  variant?: "default" | "sidebar";
  integration?: "standalone" | "combined";
  hideOccupationField?: boolean;
  requireOccupation?: boolean;
  occupationValue?: string;
  onOccupationChange?: (value: string) => void;
  onProfileLoaded?: (data: { occupation: string }) => void;
};

export const ApartmentProfileSection = forwardRef<
  ApartmentProfileSectionHandle,
  ApartmentProfileSectionProps
>(function ApartmentProfileSection(
  { variant = "default", integration = "standalone", hideOccupationField = false, requireOccupation = true, occupationValue, onOccupationChange, onProfileLoaded },
  ref,
) {
  const isCombined = integration === "combined";
  const [profileDate, setProfileDate] = useState("");
  const [entry, setEntry] = useState<ProfileEntry | null>(null);
  const [prefill, setPrefill] = useState<ProfilePrefill | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [infrastructureStatus, setInfrastructureStatus] =
    useState<InfrastructureStatus | null>(null);
  const [gasPipeStatus, setGasPipeStatus] = useState<PipeStatus | null>(null);
  const [waterPipeStatus, setWaterPipeStatus] = useState<PipeStatus | null>(null);
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userExpandedPreference, setUserExpandedPreference] = useState<
    boolean | null
  >(null);
  const panelId = useId();

  const formSetters = {
    setOccupation,
    setInfrastructureStatus,
    setGasPipeStatus,
    setWaterPipeStatus,
    setEmergencyContactName,
    setEmergencyContactPhone,
  };

  const displayEntry = entry ?? prefill;
  const hasDisplayData = Boolean(displayEntry);
  const isPrefilled = Boolean(prefill) && !isSaved;
  const canCollapse = hasDisplayData && !isEditing;
  const isExpanded = userExpandedPreference ?? !isCombined;
  const showBody = !canCollapse || isExpanded;

  function getOccupationForSave(): string {
    if (hideOccupationField && !requireOccupation) {
      return (occupation || displayEntry?.occupation || "").trim();
    }

    return (occupationValue ?? occupation).trim();
  }

  function startEditing() {
    setIsEditing(true);
    setSuccess(false);
    setError(null);
  }

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
          onProfileLoaded?.({ occupation: data.entry.occupation });
          setIsEditing(false);
          setUserExpandedPreference(null);
        } else if (data.prefill) {
          applyEntryToForm(data.prefill, formSetters);
          onProfileLoaded?.({ occupation: data.prefill.occupation });
          setIsEditing(false);
          setUserExpandedPreference(null);
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
    const occupationForSave = getOccupationForSave();

    if (requireOccupation && !occupationForSave) {
      return {
        ok: false,
        error: "Indica la ocupación de los ocupantes del apartamento.",
      };
    }

    if (
      occupationForSave &&
      exceedsMaxLength(occupationForSave, MAX_TEXT_FIELD_LENGTH)
    ) {
      return {
        ok: false,
        error: "La ocupación es demasiado larga.",
      };
    }

    if (!infrastructureStatus) {
      return {
        ok: false,
        error: "Indica el estado del apartamento (infraestructura).",
      };
    }

    if (!gasPipeStatus) {
      return {
        ok: false,
        error: "Indica el estado de las tuberías de gas.",
      };
    }

    if (!waterPipeStatus) {
      return {
        ok: false,
        error: "Indica el estado de las tuberías de agua.",
      };
    }

    if (!emergencyContactName.trim()) {
      return {
        ok: false,
        error: "Indica el nombre y apellido del contacto de emergencia.",
      };
    }

    if (!emergencyContactPhone.trim()) {
      return {
        ok: false,
        error: "Indica el teléfono del contacto de emergencia.",
      };
    }

    if (!isValidPhone(emergencyContactPhone)) {
      return {
        ok: false,
        error: "Ingresa un teléfono de emergencia válido (mínimo 10 dígitos).",
      };
    }

    return {
      ok: true,
      body: {
        occupation: occupationForSave,
        infrastructureStatus,
        gasPipeStatus,
        waterPipeStatus,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
      },
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
      setUserExpandedPreference(null);
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
        const validated = validateFormFields();
        if (!validated.ok) return validated;
        return persistProfile(validated.body);
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

  const cardClass = variant === "sidebar" ? "app-card-compact w-full" : "app-card w-full";
  const showLocalFeedback = !isCombined;

  return (
    <section className={cardClass}>
      <div className="profile-section-header">
        {canCollapse ? (
          <button
            type="button"
            className="profile-collapse-trigger"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            onClick={() =>
              setUserExpandedPreference((current) => !(current ?? !isCombined))
            }
          >
            <span
              className={`profile-collapse-title ${
                variant === "sidebar" ? "section-title text-base" : "section-title"
              }`}
            >
              Tu apartamento
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
              className={`profile-section-chevron ${isExpanded ? "profile-section-chevron-open" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : (
          <div className="min-w-0 flex-1">
            <h2
              className={
                variant === "sidebar"
                  ? "section-title text-base"
                  : "section-title"
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
        )}

        {!isEditing && hasDisplayData && isExpanded && (
          <button
            type="button"
            onClick={startEditing}
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

      {showBody && (
        <div id={panelId}>
      {showLocalFeedback && error && (
        <div role="alert" className="alert-error mt-4">{error}</div>
      )}

      {!isEditing && isPrefilled && prefill && (
        <div className="alert-info mt-4">
          Datos del {formatDateInCaracas(prefill.fromDate)} listos para hoy.
          Confírmalos o edítalos si algo cambió.
        </div>
      )}

      {showLocalFeedback && success && !isEditing && (
        <div role="status" className="alert-success mt-4">
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

          {!hideOccupationField && (
            <div>
              <label htmlFor="occupation" className="field-label">
                Ocupación o profesión de los ocupantes del apartamento
              </label>
              <textarea
                id="occupation"
                rows={3}
                value={occupationValue ?? occupation}
                onChange={(event) => {
                  const value = event.target.value;
                  setOccupation(value);
                  onOccupationChange?.(value);
                }}
                className="field-input resize-y"
                placeholder="Ej. médico, estudiante, jubilado…"
              />
            </div>
          )}

          <fieldset>
            <legend className="field-label mb-3">
              Estado del apartamento (infraestructura)
            </legend>
            <div className="infrastructure-grid">
              {INFRASTRUCTURE_STATUS_OPTIONS.map((option) => {
                const isSelected = infrastructureStatus === option.value;
                const isRisk = option.value === "uninhabitable";

                return (
                  <label
                    key={option.value}
                    className={[
                      "infrastructure-option",
                      isSelected && "infrastructure-option-selected",
                      isSelected && isRisk && "infrastructure-option-risk",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <input
                      type="radio"
                      name="infrastructureStatus"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => setInfrastructureStatus(option.value)}
                    />
                    <span
                      className="infrastructure-option-indicator"
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="h-3 w-3"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="infrastructure-option-body">
                      <span className="infrastructure-option-title">
                        {option.label}
                      </span>
                      <span className="infrastructure-option-desc">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <PipeStatusSelector
            legend="Tuberías de gas"
            name="gasPipeStatus"
            value={gasPipeStatus}
            onChange={setGasPipeStatus}
          />

          <PipeStatusSelector
            legend="Tuberías de agua"
            name="waterPipeStatus"
            value={waterPipeStatus}
            onChange={setWaterPipeStatus}
          />

          <div className="border-t border-stone-100 pt-4">
            <h3 className="text-sm font-semibold text-stone-800">
              Contacto de emergencia
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Persona a contactar en caso de emergencia en el edificio.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="emergencyContactName" className="field-label">
                  Nombre y apellido
                </label>
                <input
                  id="emergencyContactName"
                  type="text"
                  autoComplete="name"
                  value={emergencyContactName}
                  onChange={(event) =>
                    setEmergencyContactName(event.target.value)
                  }
                  className="field-input"
                  placeholder="Ej. María González"
                />
              </div>

              <div>
                <label htmlFor="emergencyContactPhone" className="field-label">
                  Teléfono
                </label>
                <input
                  id="emergencyContactPhone"
                  type="tel"
                  autoComplete="tel"
                  value={emergencyContactPhone}
                  onChange={(event) =>
                    setEmergencyContactPhone(event.target.value)
                  }
                  className="field-input"
                  placeholder="0414 1234567"
                />
              </div>
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
            {!hideOccupationField && (
              <ProfileField
                label="Ocupación"
                value={displayEntry.occupation}
              />
            )}
            <ProfileField
              label="Infraestructura"
              value={getInfrastructureStatusLabel(
                displayEntry.infrastructureStatus,
              )}
            />
            <ProfileField
              label="Tuberías de gas"
              value={getPipeStatusLabel(displayEntry.gasPipeStatus)}
            />
            <ProfileField
              label="Tuberías de agua"
              value={getPipeStatusLabel(displayEntry.waterPipeStatus)}
            />
            <ProfileField
              label="Contacto de emergencia"
              value={
                displayEntry.emergencyContactName &&
                displayEntry.emergencyContactPhone
                  ? `${displayEntry.emergencyContactName} · ${displayEntry.emergencyContactPhone}`
                  : "Sin registrar"
              }
            />
          </dl>
        )
      )}
        </div>
      )}
    </section>
  );
});
