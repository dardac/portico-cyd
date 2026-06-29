"use client";

import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";

type AuthMode = "login" | "register";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <div className="app-card">
      <div className="mb-6">
        <div className="segmented mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`segmented-btn ${
              mode === "login"
                ? "segmented-btn-active"
                : "segmented-btn-inactive"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`segmented-btn ${
              mode === "register"
                ? "segmented-btn-active"
                : "segmented-btn-inactive"
            }`}
          >
            Registrarse
          </button>
        </div>

        {mode === "login" ? (
          <>
            <h2 className="section-title">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-stone-500">
              Accede con tu apartamento y la contraseña que registraste.
            </p>
          </>
        ) : (
          <>
            <h2 className="section-title">Registrarse</h2>
            <p className="mt-1 text-sm text-stone-500">
              Primero verificamos tu apartamento y luego completas tus datos.
            </p>
          </>
        )}
      </div>

      {mode === "login" ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}
