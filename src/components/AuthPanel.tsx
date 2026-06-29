"use client";

import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";

type AuthMode = "login" | "register";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-lg shadow-stone-200/60 backdrop-blur-sm sm:p-8">
      <div className="mb-6">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "register"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Registrarse
          </button>
        </div>

        {mode === "login" ? (
          <>
            <h2 className="text-xl font-semibold text-stone-900">
              Iniciar sesión
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Accede con tu apartamento y la contraseña que registraste.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-stone-900">
              Registrarse
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Primero verificamos tu apartamento y luego completas tus datos.
            </p>
          </>
        )}
      </div>

      {mode === "login" ? (
        <LoginForm />
      ) : (
        <RegisterForm />
      )}
    </div>
  );
}
