import "server-only";
import { prisma } from "@/lib/prisma";
import { formatarDataISO } from "@/lib/dates";

const NOMES_DIAS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export type Pico = {
  data: string;
  diaSemana: string;
  volume: number;
  mediaBaseline: number;
  razao: number;
  temasPrincipais: [string, number][];
  veiculosPrincipais: [string, number][];
};

function contarMaisComuns(itens: string[], limite: number): [string, number][] {
  const contagem = new Map<string, number>();
  for (const item of itens) contagem.set(item, (contagem.get(item) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, limite);
}

/**
 * Porta de picos.py — compara o volume de notícias relevantes de cada dia
 * com a média do MESMO dia da semana nas semanas anteriores (uma
 * segunda-feira só é comparada com outras segundas, pra não misturar com o
 * padrão natural de volume menor no fim de semana). Sinaliza como pico
 * quando o volume é `limiar` vezes (ou mais) a média esperada.
 */
export async function calcularPicos(
  candidatoId: string,
  diasHistorico = 90,
  semanasBaseline = 4,
  limiar = 2.0,
  referencia?: Date,
): Promise<Pico[]> {
  const desde = referencia ? new Date(referencia) : new Date();
  desde.setDate(desde.getDate() - diasHistorico);

  const noticias = await prisma.noticia.findMany({
    where: { candidatoId, relevante: true, dataPublicacao: { gte: desde } },
    select: { dataPublicacao: true, veiculo: true, secretaria: true },
  });

  const porDia = new Map<string, typeof noticias>();
  for (const n of noticias) {
    const dia = formatarDataISO(n.dataPublicacao);
    const lista = porDia.get(dia) ?? [];
    lista.push(n);
    porDia.set(dia, lista);
  }

  // Meio-dia local evita qualquer ambiguidade de fuso ao extrair o dia da semana.
  const diaSemanaDe = (diaStr: string) => new Date(`${diaStr}T12:00:00`).getDay();

  const diasOrdenados = [...porDia.keys()].sort();
  const picos: Pico[] = [];

  for (const diaStr of diasOrdenados) {
    const diaSemanaIdx = diaSemanaDe(diaStr);

    const volumesMesmoDiaSemana = diasOrdenados
      .filter((outroStr) => outroStr < diaStr && diaSemanaDe(outroStr) === diaSemanaIdx)
      .map((outroStr) => porDia.get(outroStr)!.length);

    if (volumesMesmoDiaSemana.length < 2) continue;

    const baseline = volumesMesmoDiaSemana.slice(-semanasBaseline);
    const mediaBaseline = baseline.reduce((a, b) => a + b, 0) / baseline.length;
    const volumeAtual = porDia.get(diaStr)!.length;

    if (mediaBaseline <= 0) continue;

    const razao = volumeAtual / mediaBaseline;
    if (razao < limiar) continue;

    const registrosDoDia = porDia.get(diaStr)!;

    picos.push({
      data: diaStr,
      diaSemana: NOMES_DIAS[diaSemanaIdx],
      volume: volumeAtual,
      mediaBaseline: Math.round(mediaBaseline * 10) / 10,
      razao: Math.round(razao * 100) / 100,
      temasPrincipais: contarMaisComuns(
        registrosDoDia.map((r) => r.secretaria ?? "Outro"),
        3,
      ),
      veiculosPrincipais: contarMaisComuns(
        registrosDoDia.map((r) => r.veiculo),
        5,
      ),
    });
  }

  return picos;
}

/** Picos comparam com semanas anteriores, então olham pra trás de um
 * histórico maior do que o período do relatório — filtra só os que caem
 * dentro do período de fato (mesma lógica de _filtrar_picos_no_periodo em
 * relatorio_graficos.py). */
export function filtrarPicosNoPeriodo(picos: Pico[], inicio: Date, fim: Date): Pico[] {
  const inicioStr = formatarDataISO(inicio);
  const fimStr = formatarDataISO(fim);
  return picos.filter((p) => p.data >= inicioStr && p.data <= fimStr);
}
