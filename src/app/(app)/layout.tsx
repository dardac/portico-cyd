import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getValidatedSession } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getValidatedSession();

  if (!session) {
    redirect("/");
  }

  return <AppShell session={session}>{children}</AppShell>;
}
