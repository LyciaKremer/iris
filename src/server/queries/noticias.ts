import "server-only";
import { prisma } from "@/lib/prisma";
import { calcularPeriodo, TIPO_POR_HORARIO_PESSOA, type Horario, type HorarioPessoa } from "@/lib/horarios";

export async function listarDatasExecucao(candidatoId: string): Promise<string[]> {
  const linhas = await prisma.noticia.findMany({
    where: { candidatoId },
    distinct: ["dataExecucao"],
    select: { dataExecucao: true },
    orderBy: { dataExecucao: "desc" },
  });
  return linhas.map((l) => l.dataExecucao);
}

export async function listarPorData(candidatoId: string, dataExecucao: string) {
  return prisma.noticia.findMany({
    where: { candidatoId, dataExecucao },
    orderBy: { dataPublicacao: "desc" },
  });
}

export async function contarPendentes(candidatoId: string, dataExecucao: string): Promise<number> {
  return prisma.noticia.count({ where: { candidatoId, dataExecucao, resumo: null } });
}

export type PendenteVM = { id: string; veiculo: string; tipoVeiculo: string };

/**
 * Pendentes de UM candidato dentro da janela de um horário específico —
 * usada pelo processamento em lote (`/candidatos`). Filtra por
 * `dataPublicacao` (a mesma semântica de calcularPeriodo/exportar.ts, "a
 * data de publicação real", não a data de importação) e pelo tipo de
 * veículo daquele horário — assim o lote sabe exatamente qual recorte
 * está processando, igual a "Revisar"/"Exportar" já sabem por candidato.
 */
export async function listarPendentesPorHorario(
  candidatoId: string,
  data: string,
  horario: Horario,
  tipoCandidato: "pessoa" | "instituicao",
): Promise<PendenteVM[]> {
  const { inicio, fim } = calcularPeriodo(data, horario, tipoCandidato);
  // Mesmo filtro de tipo de veículo que a exportação usa pra esse horário
  // (prepararExportacao.ts) — "processar o 9h" e "exportar o 9h" precisam
  // significar o mesmo recorte de notícias.
  const tiposPermitidos =
    tipoCandidato === "instituicao" ? ["Rádio", "Televisão"] : [TIPO_POR_HORARIO_PESSOA[horario as HorarioPessoa]];

  const noticias = await prisma.noticia.findMany({
    where: {
      candidatoId,
      tipoVeiculo: { in: tiposPermitidos },
      dataPublicacao: { gte: inicio, lte: fim },
      resumo: null,
    },
    select: { id: true, veiculo: true, tipoVeiculo: true },
    orderBy: { dataPublicacao: "desc" },
  });

  return noticias;
}

export type ResumoDia = { dataExecucao: string; total: number; pendentes: number };

/** Um resumo por data importada (total + pendentes) pra tela de Início —
 * duas queries agregadas em vez de N+1 por data. */
export async function listarResumoPorData(candidatoId: string): Promise<ResumoDia[]> {
  const [totais, pendentesPorData] = await Promise.all([
    prisma.noticia.groupBy({ by: ["dataExecucao"], where: { candidatoId }, _count: { _all: true } }),
    prisma.noticia.groupBy({
      by: ["dataExecucao"],
      where: { candidatoId, resumo: null },
      _count: { _all: true },
    }),
  ]);

  const mapaPendentes = new Map(pendentesPorData.map((p) => [p.dataExecucao, p._count._all]));

  return totais
    .map((t) => ({
      dataExecucao: t.dataExecucao,
      total: t._count._all,
      pendentes: mapaPendentes.get(t.dataExecucao) ?? 0,
    }))
    .sort((a, b) => b.dataExecucao.localeCompare(a.dataExecucao));
}
