import { AuthPanel } from "@/components/AuthPanel";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-stone-100 via-amber-50/40 to-stone-100">
      <header className="px-4 pt-8 pb-4 sm:px-6 sm:pt-12">
        <div className="mx-auto max-w-md text-center">
          <p className="text-sm font-medium tracking-wide text-amber-800 uppercase">
            Gestión residencial
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-stone-900 sm:text-3xl">
            Pórtico del Ávila
          </h1>
          <p className="mt-1 text-lg font-medium text-stone-700">Torres C y D</p>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-10 sm:items-center sm:px-6 sm:pb-12">
        <section className="w-full max-w-md">
          <AuthPanel />
        </section>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-stone-500 sm:px-6">
        Caracas, Venezuela
      </footer>
    </div>
  );
}
