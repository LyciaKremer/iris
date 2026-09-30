"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
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
  onNavegar,
}: {
  href: string;
  label: string;
  icone: LucideIcon;
  ativo: boolean;
  onNavegar: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavegar}
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

/** Corpo do menu, compartilhado entre a versão fixa (desktop) e a gaveta
 * (mobile) — só muda o container que envolve isso em cada uma. */
function ConteudoMenu({
  candidatos,
  candidatoSlug,
  pathname,
  userEmail,
  onNavegar,
}: {
  candidatos: CandidatoOpcao[];
  candidatoSlug: string | undefined;
  pathname: string;
  userEmail: string;
  onNavegar: () => void;
}) {
  return (
    <>
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
                onNavegar={onNavegar}
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
            onNavegar={onNavegar}
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
    </>
  );
}

/**
 * Menu lateral — substitui o header horizontal, que não comportava mais o
 * número de itens (candidato + 6 abas + 3 rotas globais + usuário). Layouts
 * ACIMA do segmento [candidato] não recebem esse param via props (Next.js
 * só propaga `params` do segmento raiz até o segmento do próprio layout),
 * por isso lê o slug direto do pathname no cliente.
 *
 * Abaixo de `md`, a barra fixa de 224px não cabe (era a maior parte da
 * tela em qualquer celular) — vira uma barra superior com botão de menu
 * que abre o mesmo conteúdo numa gaveta deslizante, fechada por padrão e
 * fechada automaticamente ao navegar.
 */
export function Sidebar({ candidatos, userEmail }: { candidatos: CandidatoOpcao[]; userEmail: string }) {
  const pathname = usePathname();
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const primeiroSegmento = pathname.split("/")[1];
  const candidatoSlug =
    primeiroSegmento && !SEGMENTOS_RESERVADOS.has(primeiroSegmento) ? primeiroSegmento : undefined;

  // Fecha a gaveta ao trocar de rota (cobre navegação via CandidatoSwitcher,
  // que usa router.push em vez de <Link>, então não passa pelo onNavegar).
  // Ajuste durante o render (não um efeito) — mesmo padrão recomendado pelo
  // React pra "resetar estado quando uma prop muda", evita o ciclo extra de
  // render de um useEffect chamando setState direto no corpo.
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setGavetaAberta(false);
  }

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 md:hidden">
        <Link href="/" className="text-lg font-semibold">
          Iris
        </Link>
        <button
          type="button"
          onClick={() => setGavetaAberta(true)}
          aria-label="Abrir menu"
          className="cursor-pointer p-1 text-[var(--foreground)]"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {gavetaAberta && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setGavetaAberta(false)}
            aria-hidden="true"
          />
          <nav className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-[var(--card)] p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Iris</span>
              <button
                type="button"
                onClick={() => setGavetaAberta(false)}
                aria-label="Fechar menu"
                className="cursor-pointer p-1 text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ConteudoMenu
              candidatos={candidatos}
              candidatoSlug={candidatoSlug}
              pathname={pathname}
              userEmail={userEmail}
              onNavegar={() => setGavetaAberta(false)}
            />
          </nav>
        </div>
      )}

      <nav className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-[var(--border)] bg-[var(--card)] p-4 md:flex">
        <Link href="/" className="text-lg font-semibold">
          Iris
        </Link>
        <ConteudoMenu
          candidatos={candidatos}
          candidatoSlug={candidatoSlug}
          pathname={pathname}
          userEmail={userEmail}
          onNavegar={() => {}}
        />
      </nav>
    </>
  );
}
