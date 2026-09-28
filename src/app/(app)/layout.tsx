import { requireUser } from "@/lib/dal";
import { logoutAction } from "@/server/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChecklistFlutuante } from "@/components/checklist-flutuante";
import { VoltarAoTopo } from "@/components/voltar-ao-topo";
import { listarCandidatosAtivos } from "@/server/queries/candidatos";
import { HeaderChrome } from "./header-chrome";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const candidatos = await listarCandidatosAtivos();

  return (
    <div className="min-h-full">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <HeaderChrome candidatos={candidatos.map((c) => ({ slug: c.slug, nome: c.nome }))} />
          <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
            <span>{user.email}</span>
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="hover:text-[var(--foreground)]">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      <VoltarAoTopo />
      <ChecklistFlutuante />
    </div>
  );
}
