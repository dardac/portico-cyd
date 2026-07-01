"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApartmentField } from "@/components/ApartmentField";
import { SuccessAlert } from "@/components/ui/SuccessAlert";
import { formatApartmentInput, isValidApartment } from "@/lib/validators";

type FormErrors = {
  apartment?: string;
  password?: string;
  form?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [apartment, setApartment] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  function handleApartmentChange(value: string) {
    setApartment(formatApartmentInput(value));
    setIsSuccess(false);
    if (errors.apartment) {
      setErrors((prev) => ({ ...prev, apartment: undefined }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSuccess(false);

    const nextErrors: FormErrors = {};

    if (!apartment.trim()) {
      nextErrors.apartment = "Ingresa el número de apartamento.";
    } else if (!isValidApartment(apartment)) {
      nextErrors.apartment =
        "Usa el formato piso+unidad-letra (ej. 11-D), NT/PH + número + letra (ej. NT1-D).";
    }

    if (!password) {
      nextErrors.password = "Ingresa tu contraseña.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apartment, password }),
      });

      const data: { error?: string; success?: boolean } = await response.json();

      if (!response.ok) {
        setErrors({ form: data.error ?? "No se pudo iniciar sesión." });
        return;
      }

      setIsSuccess(true);
      router.push("/registro");
      router.refresh();
    } catch {
      setErrors({
        form: "Error de conexión. Verifica tu internet e intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.form && (
        <div role="alert" className="alert-error">
          {errors.form}
        </div>
      )}

      <SuccessAlert show={isSuccess}>
        Acceso correcto. El panel principal llegará en el siguiente paso.
      </SuccessAlert>

      <ApartmentField
        id="login-apartment"
        value={apartment}
        onChange={handleApartmentChange}
        error={errors.apartment}
        disabled={isSubmitting}
      />

      <div>
        <label htmlFor="password" className="field-label">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setIsSuccess(false);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="field-input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isSubmitting}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-stone-400 transition hover:text-stone-700 disabled:opacity-60"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? "Ocultar" : "Ver"}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="field-error">
            {errors.password}
          </p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Verificando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
