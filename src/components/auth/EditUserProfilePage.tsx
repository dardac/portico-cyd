"use client";

import { useState } from "react";
import { EditUserProfileForm } from "@/components/auth/EditUserProfileForm";
import { SuccessAlert } from "@/components/ui/SuccessAlert";

export function EditUserProfilePage() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="page-content mx-auto max-w-lg">
      <header className="page-header">
        <h1 className="page-title">Editar usuario</h1>
        <p className="page-subtitle">
          Actualiza tu correo, teléfono o contraseña.
        </p>
      </header>

      <SuccessAlert
        show={saved}
        className="mb-6"
        onHidden={() => setSaved(false)}
      >
        Perfil actualizado correctamente.
      </SuccessAlert>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 sm:p-6">
        <EditUserProfileForm
          cancelHref="/registro"
          onSuccess={() => setSaved(true)}
        />
      </div>
    </div>
  );
}
