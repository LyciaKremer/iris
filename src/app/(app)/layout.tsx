import { requireUser } from "@/lib/dal";
import { ChecklistFlutuante } from "@/components/checklist-flutuante";
import { VoltarAoTopo } from "@/components/voltar-ao-topo";
import { listarCandidatosAtivos } from "@/server/queries/candidatos";
import { Sidebar } from "./sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const candidatos = await listarCandidatosAtivos();

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <Sidebar candidatos={candidatos.map((c) => ({ slug: c.slug, nome: c.nome }))} userEmail={user.email} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">{children}</main>
      </div>
      <VoltarAoTopo />
      <ChecklistFlutuante />
    </div>
  );
}
