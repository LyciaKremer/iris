"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/server/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { CandidatoSwitcher } from "./candidato-switcher";

type CandidatoOpcao = { slug: string; nome: string };

const ITENS = [
  { segmento: "importar", label: "Importar" },
  { segmento: "revisar", label: "Revisar" },
  { segmento: "exportar", label: "Exportar" },
  { segmento: "relatorio", label: "Relatório" },
  { segmento: "picos", label: "Picos" },
  { segmento: "auditoria", label: "Auditoria" },
];

/** Único lugar que lista as rotas globais (fora de um candidato) — o
 * cálculo de `candidatoSlug` abaixo lê daqui pra nunca dessincronizar (já
 * aconteceu de esquecer uma rota nova aqui e o menu tratar ela como se
 * fosse slug de candidato). */
const ITENS_GLOBAIS = [
  { href: "/candidatos", label: "Candidatos" },
  { href: "/localizacoes", label: "Localizações" },
  { href: "/relatorio-geral", label: "Relatório geral" },
];

const SEGMENTOS_RESERVADOS = new Set(["entrar", ...ITENS_GLOBAIS.map((i) => i.href.slice(1))]);

function ItemMenu({ href, label, ativo }: { href: string; label: string; ativo: boolean }) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      className={
        "rounded-md px-3 py-2 text-sm font-medium transition-colors " +
        (ativo
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]")
      }
    >
      {label}
    </Link>
  );
}

/**
 * Menu lateral — substitui o header horizontal, que não comportava mais o
 * número de itens (candidato + 6 abas + 3 rotas globais + usuário). Layouts
 * ACIMA do segmento [candidato] não recebem esse param via props (Next.js
 * só propaga `params` do segmento raiz até o segmento do próprio layout),
 * por isso lê o slug direto do pathname no cliente.
 */
export function Sidebar({ candidatos, userEmail }: { candidatos: CandidatoOpcao[]; userEmail: string }) {
  const pathname = usePathname();
  const primeiroSegmento = pathname.split("/")[1];
  const candidatoSlug =
    primeiroSegmento && !SEGMENTOS_RESERVADOS.has(primeiroSegmento) ? primeiroSegmento : undefined;

  return (
    <nav className="sticky top-0 flex h-screen w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-[var(--border)] p-4">
      <Link href="/" className="text-lg font-semibold">
        Iris
      </Link>

      <CandidatoSwitcher candidatos={candidatos} atual={candidatoSlug} />

      {candidatoSlug && (
        <div className="flex flex-col gap-1">
          {ITENS.map((item) => {
            const href = `/${candidatoSlug}/${item.segmento}`;
            return (
              <ItemMenu key={item.segmento} href={href} label={item.label} ativo={pathname.startsWith(href)} />
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-4">
        {ITENS_GLOBAIS.map((item) => (
          <ItemMenu key={item.href} href={item.href} label={item.label} ativo={pathname.startsWith(item.href)} />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted-foreground)]">
        <span className="truncate" title={userEmail}>
          {userEmail}
        </span>
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="hover:text-[var(--foreground)]">
              Sair
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
