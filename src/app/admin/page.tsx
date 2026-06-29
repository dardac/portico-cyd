import { AdminLoginForm } from "@/components/AdminLoginForm";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-stone-100 via-amber-50/40 to-stone-100">
      <header className="px-4 pt-8 pb-4 sm:px-6 sm:pt-12">
        <div className="mx-auto max-w-md text-center">
          <p className="text-sm font-medium tracking-wide text-amber-800 uppercase">
            Administración
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-stone-900 sm:text-3xl">
            Pórtico del Ávila
          </h1>
          <p className="mt-1 text-lg font-medium text-stone-700">Torres C y D</p>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-10 sm:items-center sm:px-6 sm:pb-12">
        <section className="w-full max-w-md">
          <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-lg shadow-stone-200/60 backdrop-blur-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-stone-900">
                Acceso administrador
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Ingresa con tu usuario administrativo.
              </p>
            </div>

            <AdminLoginForm />

            <p className="mt-6 text-center text-sm text-stone-500">
              ¿Eres residente?{" "}
              <Link
                href="/"
                className="font-medium text-amber-800 hover:text-amber-900"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
