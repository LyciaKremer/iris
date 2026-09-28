import "server-only";
import { prisma } from "@/lib/prisma";
import { formatarDataISO, formatarDataBR } from "@/lib/dates";
import { carregarMapaLocalizacoes, obterLocalizacao } from "@/lib/localizacao";

export type RegistroRelatorio = {
  data: string;
  tipo: string;
  sentimento: string;
  tema: string;
  veiculo: string;
  cidade: string;
  relevante: boolean;
};

/**
 * Porta do recorte que picos.py/relatorio_graficos.py chamam de "registros"
 * (historico.py no Python) — aqui vem direto da própria Noticia, já que o
 * Iris não tem um arquivo de histórico separado. Só itens já processados
 * contam (relevante === null vira false, nunca aparece nos gráficos como
 * "relevante" só por default).
 */
export async function carregarRegistros(
  candidatoId: string,
  inicio: Date,
  fim: Date,
): Promise<RegistroRelatorio[]> {
  const noticias = await prisma.noticia.findMany({
    where: { candidatoId, dataPublicacao: { gte: inicio, lte: fim } },
    select: {
      dataPublicacao: true,
      tipoVeiculo: true,
      sentimentoFinal: true,
      sentimentoOriginal: true,
      secretaria: true,
      veiculo: true,
      relevante: true,
    },
  });

  const mapaLocalizacoes = await carregarMapaLocalizacoes();

  return noticias.map((n) => {
    const localizacao = obterLocalizacao(mapaLocalizacoes, n.veiculo);
    return {
      data: formatarDataISO(n.dataPublicacao),
      tipo: n.tipoVeiculo,
      sentimento: n.sentimentoFinal ?? n.sentimentoOriginal,
      tema: n.secretaria ?? "Outro",
      veiculo: n.veiculo,
      cidade: localizacao.cidade,
      relevante: n.relevante ?? false,
    };
  });
}

export type PeriodoResolvido = { inicio: Date; fim: Date; rotulo: string; diasHistoricoPicos: number };

/**
 * Com início/fim exatos, o período não muda dependendo de que dia a
 * geração roda; sem eles, cai numa janela rolante de `dias` a partir de
 * hoje (mesmo comportamento de _resolver_periodo em relatorio_graficos.py).
 * `diasHistoricoPicos` olha bem mais pra trás só pra ter baseline pro
 * cálculo de picos, sem limitar quais picos aparecem no relatório.
 */
export function resolverPeriodo(dias: number, inicioIso?: string, fimIso?: string): PeriodoResolvido {
  if (inicioIso && fimIso) {
    const inicio = new Date(inicioIso);
    const fim = new Date(fimIso);
    const diasDesdeInicio = Math.ceil((Date.now() - inicio.getTime()) / 86_400_000);
    return {
      inicio,
      fim,
      rotulo: `${formatarDataBR(formatarDataISO(inicio))} a ${formatarDataBR(formatarDataISO(fim))}`,
      diasHistoricoPicos: Math.max(diasDesdeInicio + 60, 90),
    };
  }

  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (dias - 1));
  return { inicio, fim, rotulo: `últimos ${dias} dias`, diasHistoricoPicos: Math.max(dias, 90) };
}
