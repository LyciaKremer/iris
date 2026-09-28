import "server-only";
import { prisma } from "@/lib/prisma";
import { montarRelatorioSemanal, type RelatorioSemanal } from "@/lib/relatorioSemanal";

/** Busca as notícias Rádio/TV relevantes no período [inicio, fim] (datas
 * "YYYY-MM-DD", inclusive) de UM candidato e monta o relatório semanal
 * agregado. Hoje é só pra candidatos "instituicao" (desenhado em torno da
 * taxonomia de secretaria da PMJP) — ver a página que chama isso. */
export async function calcularRelatorioSemanal(
  candidatoId: string,
  inicio: string,
  fim: string,
): Promise<RelatorioSemanal> {
  const noticias = await prisma.noticia.findMany({
    where: {
      candidatoId,
      dataExecucao: { gte: inicio, lte: fim },
      tipoVeiculo: { in: ["Rádio", "Televisão"] },
      relevante: true,
    },
    select: { tipoVeiculo: true, veiculo: true, secretaria: true, sentimentoFinal: true },
  });

  return montarRelatorioSemanal(noticias, { inicio, fim });
}
