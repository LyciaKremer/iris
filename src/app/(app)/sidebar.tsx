"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Upload,
  ClipboardCheck,
  Send,
  FileText,
  TrendingUp,
  Search,
  Users,
  MapPin,
  BarChart3,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/server/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { CandidatoSwitcher } from "./candidato-switcher";
import { Button } from "@/components/ui/button";

type CandidatoOpcao = { slug: string; nome: string };

const ITENS = [
  { segmento: "importar", label: "Importar", icone: Upload },
  { segmento: "revisar", label: "Revisar", icone: ClipboardCheck },
  { segmento: "exportar", label: "Exportar", icone: Send },
  { segmento: "relatorio", label: "Relatório", icone: FileText },
  { segmento: "picos", label: "Picos", icone: TrendingUp },
  { segmento: "auditoria", label: "Auditoria", icone: Search },
];

/** Único lugar que lista as rotas globais (fora de um candidato) — o
 * cálculo de `candidatoSlug` abaixo lê daqui pra nunca dessincronizar (já
 * aconteceu de esquecer uma rota nova aqui e o menu tratar ela como se
 * fosse slug de candidato). */
const ITENS_GLOBAIS = [
  { href: "/candidatos", label: "Candidatos", icone: Users },
  { href: "/localizacoes", label: "Localizações", icone: MapPin },
  { href: "/relatorio-geral", label: "Relatório geral", icone: BarChart3 },
];

const SEGMENTOS_RESERVADOS = new Set(["entrar", ...ITENS_GLOBAIS.map((i) => i.href.slice(1))]);

function ItemMenu({
  href,
  label,
  icone: Icone,
  ativo,
}: {
  href: string;
  label: string;
  icone: LucideIcon;
  ativo: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      className={
        "flex h-9 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors " +
        (ativo
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]")
      }
    >
      <Icone className="h-4 w-4 shrink-0" />
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
    <nav className="sticky top-0 flex h-screen w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-[var(--border)] bg-[var(--card)] p-4">
      <Link href="/" className="text-lg font-semibold">
        Iris
      </Link>

      <CandidatoSwitcher candidatos={candidatos} atual={candidatoSlug} />

      {candidatoSlug && (
        <div className="flex flex-col gap-1">
          {ITENS.map((item) => {
            const href = `/${candidatoSlug}/${item.segmento}`;
            return (
              <ItemMenu
                key={item.segmento}
                href={href}
                label={item.label}
                icone={item.icone}
                ativo={pathname.startsWith(href)}
              />
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-4">
        {ITENS_GLOBAIS.map((item) => (
          <ItemMenu
            key={item.href}
            href={item.href}
            label={item.label}
            icone={item.icone}
            ativo={pathname.startsWith(item.href)}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted-foreground)]">
        <span className="truncate" title={userEmail}>
          {userEmail}
        </span>
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" className="px-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </form>
        </div>
      </div>
    </nav>
  );
}
