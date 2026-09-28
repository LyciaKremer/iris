import "server-only";
import {
  svgBarrasHorizontais,
  svgBarrasEmpilhadas,
  svgBarrasDivergentes,
  svgPizza,
  svgLinha,
  svgBarrasVerticais,
  CORES_SENTIMENTO,
} from "@/lib/svgCharts";
import type { RegistroRelatorio } from "@/server/queries/relatorioGeral";
import type { Pico } from "@/server/queries/picos";

/**
 * Monta os gráficos (SVG, pra renderizar direto no navegador) das mesmas
 * métricas do relatorio_graficos.py — separado do relatório .docx
 * (relatorioGraficosDocx.ts, que continua só em tabela): aqui o SVG nunca
 * precisa ser rasterizado, então não tem o risco de compatibilidade que
 * o .docx teve com o Word.
 */

export type SecaoGrafico = { titulo: string; svg: string };

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

  // 1. Evolução do sentimento por dia
  const dias = [...new Set(relevantes.map((r) => r.data))].sort();
  secoes.push({
    titulo: "Evolução do sentimento",
    svg: svgLinha(
      dias,
      Object.entries(CORES_SENTIMENTO).map(([sentimento, cor]) => ({
        rotulo: sentimento,
        valores: dias.map((d) => relevantes.filter((r) => r.data === d && r.sentimento === sentimento).length),
        cor,
      })),
      "Evolução do sentimento por dia",
    ),
  });

  // 2. Temas mais frequentes
  secoes.push({
    titulo: "Temas mais frequentes",
    svg: svgBarrasHorizontais(contarPor(relevantes, (r) => r.tema), "Temas mais frequentes", "#455a64"),
  });

  // 3. Veículos que mais cobriram (top 10)
  secoes.push({
    titulo: "Veículos que mais cobriram",
    svg: svgBarrasHorizontais(
      contarPor(relevantes, (r) => r.veiculo).slice(0, 10),
      "Veículos que mais cobriram (top 10)",
      "#6a1b9a",
    ),
  });

  // 4. Cidades que mais cobriram (top 10) — só se houver mapeamento
  const contagemCidades = contarPor(
    relevantes.filter((r) => r.cidade !== "Desconhecida"),
    (r) => r.cidade,
  ).slice(0, 10);
  if (contagemCidades.length > 0) {
    secoes.push({
      titulo: "Cidades que mais cobriram",
      svg: svgBarrasHorizontais(contagemCidades, "Cidades que mais cobriram (cidade-sede do veículo, top 10)", "#00695c"),
    });
  }

  // 5. Sentimento por veículo (top 8, empilhado)
  const topVeiculos = contarPor(relevantes, (r) => r.veiculo)
    .slice(0, 8)
    .map((v) => v.nome);
  if (topVeiculos.length > 0) {
    const linhasEmpilhadas = topVeiculos.map((veiculo) => ({
      nome: veiculo,
      partes: Object.entries(CORES_SENTIMENTO).map(([sentimento, cor]) => ({
        rotulo: sentimento,
        valor: relevantes.filter((r) => r.veiculo === veiculo && r.sentimento === sentimento).length,
        cor,
      })),
    }));
    secoes.push({ titulo: "Sentimento por veículo", svg: svgBarrasEmpilhadas(linhasEmpilhadas, "Sentimento por veículo") });
  }

  // 6. Volume por tipo de veículo (pizza)
  const coresTipo: Record<string, string> = { Rádio: "#455a64", Televisão: "#6a1b9a", Online: "#00695c" };
  const contagemTipos = contarPor(registros, (r) => r.tipo);
  secoes.push({
    titulo: "Volume por tipo de veículo",
    svg: svgPizza(
      contagemTipos.map((t) => ({ nome: t.nome, valor: t.valor, cor: coresTipo[t.nome] ?? "#999" })),
      "Volume por tipo de veículo",
    ),
  });

  // 7. Volume diário, com picos destacados
  const datasPico = new Set(picos.map((p) => p.data));
  const volumePorDia = dias.map((d) => ({
    rotulo: d,
    valor: relevantes.filter((r) => r.data === d).length,
    destaque: datasPico.has(d),
  }));
  if (volumePorDia.length > 0) {
    secoes.push({
      titulo: "Volume diário",
      svg: svgBarrasVerticais(volumePorDia, "Volume diário de notícias (picos em vermelho)"),
    });
  }

  return secoes;
}

export type DadosCandidatoGrafico = { nome: string; registros: RegistroRelatorio[]; picos: Pico[] };

/** Gráficos comparativos entre vários candidatos (volume, distribuição de
 * sentimento, saldo) — porta da parte "visão comparativa" de
 * gerar_relatorio_geral() em relatorio_graficos.py. */
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

  const linhasDistribuicao = percentuaisPorCandidato
    .sort((a, b) => volumePorCandidato.findIndex((v) => v.nome === a.nome) - volumePorCandidato.findIndex((v) => v.nome === b.nome))
    .map((p) => ({
      nome: p.nome,
      partes: [
        { rotulo: "Negativo", valor: p.negativo, cor: CORES_SENTIMENTO.Negativo },
        { rotulo: "Neutro", valor: p.neutro, cor: CORES_SENTIMENTO.Neutro },
        { rotulo: "Positivo", valor: p.positivo, cor: CORES_SENTIMENTO.Positivo },
      ],
    }));

  const saldos = percentuaisPorCandidato
    .map((p) => ({ nome: p.nome, valor: Math.round((p.positivo - p.negativo) * 10) / 10 }))
    .sort((a, b) => b.valor - a.valor);

  return [
    { titulo: "Volume de cobertura por candidato", svg: svgBarrasHorizontais(volumePorCandidato, "Volume de cobertura relevante por candidato", "#37474f") },
    { titulo: "Distribuição de sentimento por candidato", svg: svgBarrasEmpilhadas(linhasDistribuicao, "Distribuição de sentimento por candidato (%)", true) },
    { titulo: "Saldo de sentimento por candidato", svg: svgBarrasDivergentes(saldos, "Saldo de sentimento por candidato", "% positivo − % negativo") },
  ];
}
