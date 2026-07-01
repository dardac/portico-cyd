"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";

type UserMenuProps = {
  label: string;
  onLogout: () => void;
  isLoggingOut: boolean;
};

export function UserMenu({ label, onLogout, isLoggingOut }: UserMenuProps) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const editItemRef = useRef<HTMLAnchorElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    editItemRef.current?.focus();

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }

      const items = containerRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]',
      );
      if (!items || items.length === 0) return;

      const currentIndex = Array.from(items).indexOf(
        document.activeElement as HTMLElement,
      );

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[next]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prev]?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function handleLogoutRequest() {
    setMenuOpen(false);
    setLogoutConfirmOpen(true);
  }

  function handleLogoutConfirm() {
    setLogoutConfirmOpen(false);
    onLogout();
  }

  return (
    <>
      <div ref={containerRef} className="user-menu">
        <button
          type="button"
          className={`user-menu-trigger${menuOpen ? " user-menu-trigger--open" : ""}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={`${label}, menú de usuario`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className="user-menu-icon"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6.75 9a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM1.5 16.125c0-1.036.84-1.875 1.875-1.875h13.25c1.035 0 1.875.84 1.875 1.875v.375c0 .621-.504 1.125-1.125 1.125H2.625A1.125 1.125 0 0 1 1.5 16.5v-.375Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {menuOpen && (
          <div id={menuId} role="menu" className="user-menu-dropdown">
            <Link
              ref={editItemRef}
              href="/perfil"
              role="menuitem"
              className="user-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              Editar usuario
            </Link>
            <button
              type="button"
              role="menuitem"
              className="user-menu-item user-menu-item--danger"
              onClick={handleLogoutRequest}
              disabled={isLoggingOut}
            >
              Salir
            </button>
          </div>
        )}
      </div>

      <AppModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="¿Cerrar sesión?"
        description="Tendrás que volver a iniciar sesión para acceder a la aplicación."
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(false)}
            disabled={isLoggingOut}
            className="btn-ghost"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleLogoutConfirm}
            disabled={isLoggingOut}
            className="btn-primary sm:w-auto"
          >
            {isLoggingOut ? "Saliendo…" : "Sí, salir"}
          </button>
        </div>
      </AppModal>
    </>
  );
}
