import "server-only";
import type { RegistroRelatorio } from "@/server/queries/relatorioGeral";
import type { Pico } from "@/server/queries/picos";

/**
 * Monta as ESPECIFICAÇÕES dos gráficos (dado estruturado, não SVG/string) —
 * quem desenha é o componente React (src/components/charts), que sabe
 * herdar fonte/tema do resto do app. Antes disso gerávamos string de SVG
 * no servidor; a fonte ficava hardcoded e o alinhamento era feito na mão
 * (pixel a pixel), o que rendia o visual "torto" e destoante que a usuária
 * reportou. Separado do relatório .docx (relatorioGraficosDocx.ts, que
 * continua só em tabela).
 */

export type EspecificacaoGrafico =
  | { tipo: "ranking"; dados: { nome: string; valor: number }[] }
  | {
      tipo: "sentimentoEmpilhado";
      percentual?: boolean;
      linhas: { nome: string; positivo: number; negativo: number; neutro: number }[];
    }
  | { tipo: "saldoSentimento"; dados: { nome: string; valor: number }[] }
  | { tipo: "tipoVeiculoDonut"; dados: { nome: string; valor: number }[] }
  | { tipo: "linhaSentimento"; eixoX: string[]; positivo: number[]; negativo: number[]; neutro: number[] }
  | { tipo: "volumeDiario"; dados: { rotulo: string; valor: number; destaque: boolean }[] };

export type SecaoGrafico = { titulo: string; grafico: EspecificacaoGrafico };

function contarPor<T>(itens: T[], chave: (item: T) => string): { nome: string; valor: number }[] {
  const contagem = new Map<string, number>();
  for (const item of itens) {
    const k = chave(item);
    contagem.set(k, (contagem.get(k) ?? 0) + 1);
  }
  return [...contagem.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
}

export function gerarSecoesCandidato(registros: RegistroRelatorio[], picos: Pico[]): SecaoGrafico[] {
  const relevantes = registros.filter((r) => r.relevante);
  const secoes: SecaoGrafico[] = [];

  const contarSentimento = (itens: RegistroRelatorio[], sentimento: string) =>
    itens.filter((r) => r.sentimento === sentimento).length;

  // 1. Evolução do sentimento por dia
  const dias = [...new Set(relevantes.map((r) => r.data))].sort();
  secoes.push({
    titulo: "Evolução do sentimento por dia",
    grafico: {
      tipo: "linhaSentimento",
      eixoX: dias,
      positivo: dias.map((d) => contarSentimento(relevantes.filter((r) => r.data === d), "Positivo")),
      negativo: dias.map((d) => contarSentimento(relevantes.filter((r) => r.data === d), "Negativo")),
      neutro: dias.map((d) => contarSentimento(relevantes.filter((r) => r.data === d), "Neutro")),
    },
  });

  // 2. Temas mais frequentes
  secoes.push({ titulo: "Temas mais frequentes", grafico: { tipo: "ranking", dados: contarPor(relevantes, (r) => r.tema) } });

  // 3. Veículos que mais cobriram (top 10)
  secoes.push({
    titulo: "Veículos que mais cobriram (top 10)",
    grafico: { tipo: "ranking", dados: contarPor(relevantes, (r) => r.veiculo).slice(0, 10) },
  });

  // 4. Cidades que mais cobriram (top 10) — só se houver mapeamento
  const contagemCidades = contarPor(
    relevantes.filter((r) => r.cidade !== "Desconhecida"),
    (r) => r.cidade,
  ).slice(0, 10);
  if (contagemCidades.length > 0) {
    secoes.push({
      titulo: "Cidades que mais cobriram (cidade-sede do veículo, top 10)",
      grafico: { tipo: "ranking", dados: contagemCidades },
    });
  }

  // 5. Sentimento por veículo (top 8)
  const topVeiculos = contarPor(relevantes, (r) => r.veiculo)
    .slice(0, 8)
    .map((v) => v.nome);
  if (topVeiculos.length > 0) {
    secoes.push({
      titulo: "Sentimento por veículo",
      grafico: {
        tipo: "sentimentoEmpilhado",
        linhas: topVeiculos.map((veiculo) => {
          const doVeiculo = relevantes.filter((r) => r.veiculo === veiculo);
          return {
            nome: veiculo,
            positivo: contarSentimento(doVeiculo, "Positivo"),
            negativo: contarSentimento(doVeiculo, "Negativo"),
            neutro: contarSentimento(doVeiculo, "Neutro"),
          };
        }),
      },
    });
  }

  // 6. Volume por tipo de veículo
  secoes.push({
    titulo: "Volume por tipo de veículo",
    grafico: { tipo: "tipoVeiculoDonut", dados: contarPor(registros, (r) => r.tipo) },
  });

  // 7. Volume diário, com picos destacados
  const datasPico = new Set(picos.map((p) => p.data));
  const volumePorDia = dias.map((d) => ({
    rotulo: d,
    valor: relevantes.filter((r) => r.data === d).length,
    destaque: datasPico.has(d),
  }));
  if (volumePorDia.length > 0) {
    secoes.push({ titulo: "Volume diário (picos em destaque)", grafico: { tipo: "volumeDiario", dados: volumePorDia } });
  }

  return secoes;
}

export type DadosCandidatoGrafico = { nome: string; registros: RegistroRelatorio[]; picos: Pico[] };

/** Gráficos comparativos entre vários candidatos — porta da parte "visão
 * comparativa" de gerar_relatorio_geral() em relatorio_graficos.py. */
export function gerarSecoesComparativo(dados: DadosCandidatoGrafico[]): SecaoGrafico[] {
  const volumePorCandidato = dados
    .map((d) => ({ nome: d.nome, valor: d.registros.filter((r) => r.relevante).length }))
    .sort((a, b) => b.valor - a.valor);

  const percentuaisPorCandidato = dados.map((d) => {
    const relevantes = d.registros.filter((r) => r.relevante);
    const total = relevantes.length || 1;
    const pct = (sentimento: string) => (relevantes.filter((r) => r.sentimento === sentimento).length / total) * 100;
    return { nome: d.nome, positivo: pct("Positivo"), negativo: pct("Negativo"), neutro: pct("Neutro") };
  });

  const ordemPorVolume = new Map(volumePorCandidato.map((v, i) => [v.nome, i]));
  const linhasDistribuicao = [...percentuaisPorCandidato].sort(
    (a, b) => (ordemPorVolume.get(a.nome) ?? 0) - (ordemPorVolume.get(b.nome) ?? 0),
  );

  const saldos = percentuaisPorCandidato
    .map((p) => ({ nome: p.nome, valor: Math.round((p.positivo - p.negativo) * 10) / 10 }))
    .sort((a, b) => b.valor - a.valor);

  return [
    { titulo: "Volume de cobertura relevante por candidato", grafico: { tipo: "ranking", dados: volumePorCandidato } },
    {
      titulo: "Distribuição de sentimento por candidato (%)",
      grafico: { tipo: "sentimentoEmpilhado", percentual: true, linhas: linhasDistribuicao },
    },
    {
      titulo: "Saldo de sentimento por candidato (% positivo − % negativo)",
      grafico: { tipo: "saldoSentimento", dados: saldos },
    },
  ];
}
