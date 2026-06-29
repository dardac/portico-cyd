import Link from "next/link";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function AdminLoginPage() {
  return (
    <AuthLayout eyebrow="Administración">
      <div className="app-card">
        <div className="mb-6">
          <h2 className="section-title">Acceso administrador</h2>
          <p className="mt-1 text-sm text-stone-500">
            Ingresa con tu usuario administrativo.
          </p>
        </div>

        <AdminLoginForm />

        <p className="mt-6 text-center text-sm text-stone-400">
          ¿Eres residente?{" "}
          <Link
            href="/"
            className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-2 transition hover:text-stone-900 hover:decoration-stone-500"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
