import { APP_NAME, BUILDING_NAME, BUILDING_SUBTITLE } from "@/lib/branding";

type AuthLayoutProps = {
  eyebrow: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthLayout({
  eyebrow,
  title = BUILDING_NAME,
  subtitle = BUILDING_SUBTITLE,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="app-bg">
      <header className="px-4 pt-10 pb-6 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-md text-center">
          {/* <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-sm font-semibold text-white">
            PA
          </div> */}
          <p className="app-brand">{APP_NAME}</p>
          <p className="page-eyebrow mt-3">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
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
