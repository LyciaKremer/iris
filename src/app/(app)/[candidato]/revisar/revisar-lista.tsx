"use client";

import { useMemo, useState } from "react";
import { horariosPorTipo, horarioDeNoticia, type Horario } from "@/lib/horarios";
import { Select } from "@/components/ui/input";
import { NoticiaRow, type NoticiaVM } from "./noticia-row";

const FILTROS_RELEVANCIA = ["Todas", "Pendente", "Relevante", "Não relevante"] as const;
type FiltroRelevancia = (typeof FILTROS_RELEVANCIA)[number];

function passaFiltroRelevancia(noticia: NoticiaVM, filtro: FiltroRelevancia): boolean {
  if (filtro === "Todas") return true;
  if (filtro === "Pendente") return noticia.resumo === null;
  if (filtro === "Relevante") return noticia.resumo !== null && noticia.relevante !== false;
  return noticia.resumo !== null && noticia.relevante === false;
}

/**
 * Filtros client-side (relevância + horário de disparo) por cima da lista
 * que a página já busca no servidor — evita ter que rolar uma lista grande
 * e diversa pra achar só o que interessa no momento (ex: só o que ficou
 * irrelevante, ou só o recorte de um horário específico, pra investigar um
 * export que trouxe menos/mais itens do que esperado).
 */
export function RevisarLista({
  noticias,
  rotuloClassificacao,
  dataAtual,
  tipoCandidato,
}: {
  noticias: NoticiaVM[];
  rotuloClassificacao: "secretaria" | "tema";
  dataAtual: string;
  tipoCandidato: "pessoa" | "instituicao";
}) {
  const [filtroRelevancia, setFiltroRelevancia] = useState<FiltroRelevancia>("Todas");
  const [filtroHorario, setFiltroHorario] = useState<Horario | "Todos">("Todos");

  const horarios = horariosPorTipo(tipoCandidato);

  const noticiasComHorario = useMemo(
    () =>
      noticias.map((n) => ({
        noticia: n,
        horario: horarioDeNoticia(n.dataPublicacao, dataAtual, tipoCandidato),
      })),
    [noticias, dataAtual, tipoCandidato],
  );

  const visiveis = noticiasComHorario.filter(
    ({ noticia, horario }) =>
      passaFiltroRelevancia(noticia, filtroRelevancia) &&
      (filtroHorario === "Todos" || horario === filtroHorario),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filtroRelevancia}
          onChange={(e) => setFiltroRelevancia(e.target.value as FiltroRelevancia)}
          className="w-40"
          aria-label="Filtrar por relevância"
        >
          {FILTROS_RELEVANCIA.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>

        <Select
          value={filtroHorario}
          onChange={(e) => setFiltroHorario(e.target.value as Horario | "Todos")}
          className="w-32"
          aria-label="Filtrar por horário de disparo"
        >
          <option value="Todos">Todo horário</option>
          {horarios.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </Select>

        <p className="text-sm text-[var(--muted-foreground)]">
          {visiveis.length} de {noticias.length} notícia(s)
        </p>
      </div>

      <div className="space-y-3">
        {visiveis.map(({ noticia }) => (
          <NoticiaRow key={noticia.id} noticia={noticia} rotuloClassificacao={rotuloClassificacao} />
        ))}
        {visiveis.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)] italic">
            Nenhuma notícia bate com esses filtros.
          </p>
        )}
      </div>
    </div>
  );
}
