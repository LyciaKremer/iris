"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { segmento: "importar", label: "Importar" },
  { segmento: "revisar", label: "Revisar" },
  { segmento: "exportar", label: "Exportar" },
  { segmento: "relatorio", label: "Relatório" },
  { segmento: "picos", label: "Picos" },
  { segmento: "auditoria", label: "Auditoria" },
];

/** Único lugar que lista as rotas globais (fora de um candidato) — tanto
 * o Nav quanto HeaderChrome (que precisa saber quando o 1º segmento da
 * URL NÃO é slug de candidato) leem daqui, pra nunca dessincronizar. */
export const ITENS_GLOBAIS = [
  { href: "/candidatos", label: "Candidatos" },
  { href: "/localizacoes", label: "Localizações" },
  { href: "/relatorio-geral", label: "Relatório geral" },
];

/** `candidatoSlug` undefined em páginas fora de um candidato (ex: /candidatos) —
 * nesse caso os itens de navegação não têm pra onde apontar, então ficam ocultos. */
export function Nav({ candidatoSlug }: { candidatoSlug?: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/" className="font-semibold">
        Iris
      </Link>
      {candidatoSlug &&
        ITENS.map((item) => {
          const href = `/${candidatoSlug}/${item.segmento}`;
          const ativo = pathname.startsWith(href);
          return (
            <Link
              key={item.segmento}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={
                ativo
                  ? "font-medium text-[var(--foreground)] underline decoration-[var(--primary)] decoration-2 underline-offset-4"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }
            >
              {item.label}
            </Link>
          );
        })}
      {ITENS_GLOBAIS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname.startsWith(item.href) ? "page" : undefined}
          className={
            pathname.startsWith(item.href)
              ? "font-medium text-[var(--foreground)] underline decoration-[var(--primary)] decoration-2 underline-offset-4"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
