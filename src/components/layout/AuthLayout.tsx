import { APP_NAME } from "@/lib/branding";
import { AppLogo } from "@/components/layout/AppLogo";

type AuthLayoutProps = {
  eyebrow: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthLayout({
  eyebrow,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="app-bg">
      <header className="px-4 pt-10 pb-6 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-md text-center">
          <p className="app-brand">{APP_NAME}</p>
          <p className="page-eyebrow mt-3">{eyebrow}</p>
          <AppLogo variant="auth" priority className="mt-6 sm:mt-8" />
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-10 sm:items-center sm:px-6 sm:pb-14">
        <section className="w-full max-w-md">{children}</section>
      </main>

      {footer ?? (
        <footer className="px-4 pb-8 text-center text-xs text-stone-400 sm:px-6">
          {APP_NAME} · Caracas, Venezuela
        </footer>
      )}
    </div>
  );
}
