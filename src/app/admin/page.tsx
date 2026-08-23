import type { Metadata } from "next";

import { AdminPanel } from "@/components/admin/admin-panel";
import { LoginForm } from "@/components/admin/login-form";
import { listVehicles } from "@/db/queries";
import { hasSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Área do vendedor",
  // O painel nao tem nada que interesse a busca, e nao deve aparecer nela.
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await hasSession())) return <LoginForm />;

  return <AdminPanel vehicles={await listVehicles()} />;
}
