import "server-only";
import { prisma } from "@/lib/prisma";
import { montarRelatorioSemanal, type RelatorioSemanal } from "@/lib/relatorioSemanal";

/** Busca as notícias Rádio/TV relevantes no período [inicio, fim] (datas
 * "YYYY-MM-DD", inclusive) e monta o relatório semanal agregado. */
export async function calcularRelatorioSemanal(
  inicio: string,
  fim: string,
): Promise<RelatorioSemanal> {
  const noticias = await prisma.noticia.findMany({
    where: {
      dataExecucao: { gte: inicio, lte: fim },
      tipoVeiculo: { in: ["Rádio", "Televisão"] },
      relevante: true,
    },
    select: { tipoVeiculo: true, veiculo: true, secretaria: true, sentimentoFinal: true },
  });

  return montarRelatorioSemanal(noticias, { inicio, fim });
}
