/**
 * Agregações puras do relatório semanal (item 2 do direcionamento da
 * PMJP) — recebem a lista de notícias já filtrada (Rádio/TV, relevante)
 * e não tocam banco nem IA, pra serem reaproveitadas pela prévia na tela
 * e pelos dois geradores de arquivo (.docx e PDF) sem duplicar lógica.
 */

export type NoticiaRelatorio = {
  tipoVeiculo: string;
  veiculo: string;
  secretaria: string | null;
  sentimentoFinal: string | null;
};

export type RankingItem = { nome: string; quantidade: number };
export type FatiaPercentual = RankingItem & { percentual: number };

export type RelatorioSemanal = {
  periodo: { inicio: string; fim: string };
  totalNoticias: number;
  veiculosPorTipo: Record<string, RankingItem[]>;
  veiculosNegativos: RankingItem[];
  secretariasNegativas: RankingItem[];
  secretariasPositivas: RankingItem[];
  percentualPorSecretaria: FatiaPercentual[];
};

function contarEOrdenar(itens: string[]): RankingItem[] {
  const contagem = new Map<string, number>();
  for (const item of itens) {
    contagem.set(item, (contagem.get(item) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

export function montarRelatorioSemanal(
  noticias: NoticiaRelatorio[],
  periodo: { inicio: string; fim: string },
): RelatorioSemanal {
  const veiculosPorTipo: Record<string, RankingItem[]> = {};
  for (const tipo of ["Rádio", "Televisão"]) {
    veiculosPorTipo[tipo] = contarEOrdenar(
      noticias.filter((n) => n.tipoVeiculo === tipo).map((n) => n.veiculo),
    );
  }

  const negativas = noticias.filter((n) => n.sentimentoFinal === "Negativo");
  const positivas = noticias.filter((n) => n.sentimentoFinal === "Positivo");

  const veiculosNegativos = contarEOrdenar(negativas.map((n) => n.veiculo));
  const secretariasNegativas = contarEOrdenar(negativas.map((n) => n.secretaria ?? "Outro"));
  const secretariasPositivas = contarEOrdenar(positivas.map((n) => n.secretaria ?? "Outro"));

  const distribuicaoSecretarias = contarEOrdenar(noticias.map((n) => n.secretaria ?? "Outro"));
  const total = noticias.length;
  const percentualPorSecretaria: FatiaPercentual[] = distribuicaoSecretarias.map((item) => ({
    ...item,
    percentual: total > 0 ? Math.round((item.quantidade / total) * 1000) / 10 : 0,
  }));

  return {
    periodo,
    totalNoticias: total,
    veiculosPorTipo,
    veiculosNegativos,
    secretariasNegativas,
    secretariasPositivas,
    percentualPorSecretaria,
  };
}
