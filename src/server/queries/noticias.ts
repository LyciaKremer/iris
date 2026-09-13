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
