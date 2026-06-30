"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { AppSession } from "@/lib/auth/session";

type AppShellProps = {
  session: AppSession;
  children: React.ReactNode;
};

const NAV_ITEMS = [{ href: "/censo", label: "Censo diario" }];

export function AppShell({ session, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(session.type === "admin" ? "/admin" : "/");
    router.refresh();
  }

  const sessionLabel =
    session.type === "admin"
      ? `Admin · ${session.username}`
      : `Apto. ${session.apartmentCode}`;

  return (
    <div className="app-bg">
      <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200/70 text-stone-500 transition hover:border-stone-300 hover:bg-stone-50/80 hover:text-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900/20 md:hidden"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">Menú</span>
              <div className="flex flex-col gap-[3px]">
                <span
                  className={`block h-px w-3.5 bg-current transition ${menuOpen ? "translate-y-[4px] rotate-45" : ""}`}
                />
                <span
                  className={`block h-px w-3.5 bg-current transition ${menuOpen ? "opacity-0" : ""}`}
                />
                <span
                  className={`block h-px w-3.5 bg-current transition ${menuOpen ? "-translate-y-[4px] -rotate-45" : ""}`}
                />
              </div>
            </button>

            <div className="flex items-center gap-2.5">
              {/* <div className="hidden h-7 w-7 items-center justify-center rounded-md bg-stone-900 text-[10px] font-semibold text-white sm:flex">
                PA
              </div> */}
              <div>
                <p className="text-sm font-semibold tracking-tight text-stone-900">
                  Pórtico del Ávila
                </p>
                <p className="hidden text-xs text-stone-400 sm:block">
                  Torres C y D
                </p>
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-sm transition ${
                    isActive
                      ? "font-medium text-brick"
                      : "font-medium text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <span className="hidden max-w-[10rem] truncate text-right text-xs text-stone-400 sm:block">
              {sessionLabel}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="btn-ghost"
            >
              {isLoggingOut ? "Saliendo…" : "Salir"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-stone-200/60 px-4 py-3 md:hidden">
            <p className="mb-2 text-xs text-stone-400">{sessionLabel}</p>
            <div className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-3 py-2 text-sm transition ${
                      isActive
                        ? "font-medium text-brick"
                        : "font-medium text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
