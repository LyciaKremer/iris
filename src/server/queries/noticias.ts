import "server-only";
import { prisma } from "@/lib/prisma";

export async function listarDatasExecucao(): Promise<string[]> {
  const linhas = await prisma.noticia.findMany({
    distinct: ["dataExecucao"],
    select: { dataExecucao: true },
    orderBy: { dataExecucao: "desc" },
  });
  return linhas.map((l) => l.dataExecucao);
}

export async function listarPorData(dataExecucao: string) {
  return prisma.noticia.findMany({
    where: { dataExecucao },
    orderBy: { dataPublicacao: "desc" },
  });
}

export async function contarPendentes(dataExecucao: string): Promise<number> {
  return prisma.noticia.count({ where: { dataExecucao, resumo: null } });
}

export type ResumoDia = { dataExecucao: string; total: number; pendentes: number };

/** Um resumo por data importada (total + pendentes) pra tela de Início —
 * duas queries agregadas em vez de N+1 por data. */
export async function listarResumoPorData(): Promise<ResumoDia[]> {
  const [totais, pendentesPorData] = await Promise.all([
    prisma.noticia.groupBy({ by: ["dataExecucao"], _count: { _all: true } }),
    prisma.noticia.groupBy({
      by: ["dataExecucao"],
      where: { resumo: null },
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
