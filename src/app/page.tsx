import { AuthPanel } from "@/components/AuthPanel";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function Home() {
  return (
    <AuthLayout eyebrow="Gestión residencial">
      <AuthPanel />
    </AuthLayout>
  );
}
