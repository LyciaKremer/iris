"use client";

import { usePathname } from "next/navigation";
import { Nav, ITENS_GLOBAIS } from "./nav";
import { CandidatoSwitcher } from "./candidato-switcher";

type CandidatoOpcao = { slug: string; nome: string };

const SEGMENTOS_RESERVADOS = new Set(["entrar", ...ITENS_GLOBAIS.map((i) => i.href.slice(1))]);

/**
 * Layouts ACIMA do segmento [candidato] não recebem esse param via props
 * (Next.js só propaga `params` do segmento raiz até o segmento do próprio
 * layout, nunca de segmentos filhos) — por isso isso lê o slug direto do
 * pathname no cliente, em vez de depender de params vindos do servidor.
 *
 * SEGMENTOS_RESERVADOS deriva de ITENS_GLOBAIS (nav.tsx) pra nunca
 * dessincronizar — uma rota global esquecida aqui faz o Nav tratá-la como
 * se fosse slug de candidato (bug real, pego em teste: /localizacoes virou
 * "candidato" e gerou links tipo /localizacoes/importar).
 */
export function HeaderChrome({ candidatos }: { candidatos: CandidatoOpcao[] }) {
  const pathname = usePathname();
  const primeiroSegmento = pathname.split("/")[1];
  const candidatoSlug =
    primeiroSegmento && !SEGMENTOS_RESERVADOS.has(primeiroSegmento) ? primeiroSegmento : undefined;

  return (
    <div className="flex items-center gap-4">
      <Nav candidatoSlug={candidatoSlug} />
      <CandidatoSwitcher candidatos={candidatos} atual={candidatoSlug} />
    </div>
  );
}
