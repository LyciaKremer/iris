import "server-only";
import { prisma } from "@/lib/prisma";

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

/** Ids pendentes de UM candidato numa data — usado pelo processamento em
 * lote (vários candidatos de uma vez), que roda isso por candidato
 * selecionado antes de processar item a item. */
export async function listarIdsPendentes(candidatoId: string, dataExecucao: string): Promise<string[]> {
  const noticias = await prisma.noticia.findMany({
    where: { candidatoId, dataExecucao, resumo: null },
    select: { id: true },
  });
  return noticias.map((n) => n.id);
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
