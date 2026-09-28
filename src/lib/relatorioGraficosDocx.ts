import "server-only";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
} from "docx";
import { formatarDataBR } from "@/lib/dates";
import type { RegistroRelatorio } from "@/server/queries/relatorioGeral";
import type { Pico } from "@/server/queries/picos";

/**
 * Porta de relatorio_graficos.py — mesmos valores/métricas do relatório do
 * alertas-wpp (individual por candidato e comparativo entre vários), só
 * que em TABELAS por enquanto (sem gráfico) — mesmo estilo já usado no
 * "relatório semanal" (relatorioDocx.ts), que é uma feature separada e
 * continua intocada (PMJP-only, 5 métricas fixas).
 */

type Nivel = (typeof HeadingLevel)[keyof typeof HeadingLevel];

function celula(texto: string): TableCell {
  return new TableCell({ children: [new Paragraph(texto)] });
}

function titulo(texto: string, nivel: Nivel): Paragraph {
  return new Paragraph({ text: texto, heading: nivel });
}

function tabelaRanking(itens: { nome: string; valor: number }[], colunaValor: string): Table | Paragraph {
  if (itens.length === 0) return new Paragraph("Nenhum registro no período.");

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [celula("Nome"), celula(colunaValor)] }),
      ...itens.map((item) => new TableRow({ children: [celula(item.nome), celula(String(item.valor))] })),
    ],
  });
}

function tabelaPorSentimento(
  linhas: { nome: string; positivo: number; negativo: number; neutro: number }[],
  colunaNome: string,
): Table | Paragraph {
  if (linhas.length === 0) return new Paragraph("Nenhum registro no período.");

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [celula(colunaNome), celula("Positivo"), celula("Negativo"), celula("Neutro")],
      }),
      ...linhas.map(
        (l) =>
          new TableRow({
            children: [celula(l.nome), celula(String(l.positivo)), celula(String(l.negativo)), celula(String(l.neutro))],
          }),
      ),
    ],
  });
}

function contarPor<T>(itens: T[], chave: (item: T) => string): { nome: string; valor: number }[] {
  const contagem = new Map<string, number>();
  for (const item of itens) {
    const k = chave(item);
    contagem.set(k, (contagem.get(k) ?? 0) + 1);
  }
  return [...contagem.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
}

function secaoPicos(picos: Pico[], nivel: Nivel): Paragraph[] {
  const paragrafos: Paragraph[] = [titulo("Picos de volume", nivel)];

  if (picos.length === 0) {
    paragrafos.push(
      new Paragraph(
        "Nenhum dia com volume muito acima do esperado nesse período (comparado com o mesmo dia da semana em semanas anteriores).",
      ),
    );
    return paragrafos;
  }

  for (const pico of picos) {
    paragrafos.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${formatarDataBR(pico.data)} (${pico.diaSemana}) — ${pico.volume} notícias, ${pico.razao}x acima da média de ${pico.mediaBaseline} pra esse dia da semana.`,
            bold: true,
          }),
        ],
      }),
    );
    const temas = pico.temasPrincipais.map(([t, q]) => `${t} (${q})`).join(", ") || "—";
    const veiculos = pico.veiculosPrincipais.map(([v, q]) => `${v} (${q})`).join(", ") || "—";
    paragrafos.push(new Paragraph(`Temas que mais apareceram: ${temas}`));
    paragrafos.push(new Paragraph(`Veículos que mais publicaram: ${veiculos}`));
  }

  return paragrafos;
}

/** Monta as tabelas de UM candidato — reaproveitado tanto no relatório
 * individual quanto na seção "detalhamento" do comparativo. */
function secaoCandidato(
  registros: RegistroRelatorio[],
  picos: Pico[],
  nivel: Nivel,
): (Paragraph | Table)[] {
  const relevantes = registros.filter((r) => r.relevante);
  const partes: (Paragraph | Table)[] = [];

  const contarSentimento = (itens: RegistroRelatorio[], sentimento: string) =>
    itens.filter((r) => r.sentimento === sentimento).length;

  // 1. Evolução do sentimento por dia
  const dias = [...new Set(relevantes.map((r) => r.data))].sort();
  partes.push(titulo("Evolução do sentimento por dia", nivel));
  partes.push(
    tabelaPorSentimento(
      dias.map((d) => {
        const doDia = relevantes.filter((r) => r.data === d);
        return {
          nome: formatarDataBR(d),
          positivo: contarSentimento(doDia, "Positivo"),
          negativo: contarSentimento(doDia, "Negativo"),
          neutro: contarSentimento(doDia, "Neutro"),
        };
      }),
      "Data",
    ),
  );

  // 2. Temas mais frequentes
  partes.push(titulo("Temas mais frequentes", nivel));
  partes.push(tabelaRanking(contarPor(relevantes, (r) => r.tema), "Notícias"));

  // 3. Veículos que mais cobriram (top 10)
  partes.push(titulo("Veículos que mais cobriram (top 10)", nivel));
  partes.push(tabelaRanking(contarPor(relevantes, (r) => r.veiculo).slice(0, 10), "Notícias"));

  // 4. Cidades que mais cobriram (top 10) — só se houver mapeamento
  const contagemCidades = contarPor(
    relevantes.filter((r) => r.cidade !== "Desconhecida"),
    (r) => r.cidade,
  ).slice(0, 10);
  if (contagemCidades.length > 0) {
    partes.push(titulo("Cidades que mais cobriram (top 10)", nivel));
    partes.push(tabelaRanking(contagemCidades, "Notícias"));
  }

  // 5. Sentimento por veículo (top 8)
  const topVeiculos = contarPor(relevantes, (r) => r.veiculo)
    .slice(0, 8)
    .map((v) => v.nome);
  if (topVeiculos.length > 0) {
    partes.push(titulo("Sentimento por veículo", nivel));
    partes.push(
      tabelaPorSentimento(
        topVeiculos.map((veiculo) => {
          const doVeiculo = relevantes.filter((r) => r.veiculo === veiculo);
          return {
            nome: veiculo,
            positivo: contarSentimento(doVeiculo, "Positivo"),
            negativo: contarSentimento(doVeiculo, "Negativo"),
            neutro: contarSentimento(doVeiculo, "Neutro"),
          };
        }),
        "Veículo",
      ),
    );
  }

  // 6. Volume por tipo de veículo
  partes.push(titulo("Volume por tipo de veículo", nivel));
  partes.push(tabelaRanking(contarPor(registros, (r) => r.tipo), "Notícias"));

  // 7. Volume diário (dias de pico marcados)
  const datasPico = new Set(picos.map((p) => p.data));
  if (dias.length > 0) {
    partes.push(titulo("Volume diário", nivel));
    partes.push(
      tabelaRanking(
        dias.map((d) => ({
          nome: formatarDataBR(d) + (datasPico.has(d) ? " ⚠ pico" : ""),
          valor: relevantes.filter((r) => r.data === d).length,
        })),
        "Notícias",
      ),
    );
  }

  partes.push(...secaoPicos(picos, nivel));

  return partes;
}

export type DadosCandidatoRelatorio = {
  nome: string;
  registros: RegistroRelatorio[];
  picos: Pico[];
};

/** Relatório de UM candidato. */
export async function gerarRelatorioGraficosDocx(
  candidatoNome: string,
  rotuloPeriodo: string,
  registros: RegistroRelatorio[],
  picos: Pico[],
): Promise<Buffer> {
  const relevantes = registros.filter((r) => r.relevante);
  const taxa = registros.length ? Math.round((relevantes.length / registros.length) * 100) : 0;

  const corpo = secaoCandidato(registros, picos, HeadingLevel.HEADING_1);

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: `Relatório de Clipping — ${candidatoNome}`, heading: HeadingLevel.TITLE }),
          new Paragraph({
            children: [new TextRun({ text: `Período: ${rotuloPeriodo}`, italics: true })],
          }),
          new Paragraph(
            `Total de notícias monitoradas: ${registros.length}  |  Relevantes: ${relevantes.length} (${taxa}%)`,
          ),
          ...corpo,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

/** Relatório comparativo entre vários candidatos, com uma seção de
 * detalhamento individual (tabelas + picos) por candidato ao final —
 * porta de gerar_relatorio_geral() em relatorio_graficos.py. */
export async function gerarRelatorioGeralDocx(rotuloPeriodo: string, dados: DadosCandidatoRelatorio[]): Promise<Buffer> {
  const nomes = dados.map((d) => d.nome);

  const volumePorCandidato = dados
    .map((d) => ({ nome: d.nome, valor: d.registros.filter((r) => r.relevante).length }))
    .sort((a, b) => b.valor - a.valor);

  const percentuaisPorCandidato = dados.map((d) => {
    const relevantes = d.registros.filter((r) => r.relevante);
    const total = relevantes.length || 1;
    const pct = (sentimento: string) => Math.round((relevantes.filter((r) => r.sentimento === sentimento).length / total) * 1000) / 10;
    return { nome: d.nome, positivo: pct("Positivo"), negativo: pct("Negativo"), neutro: pct("Neutro") };
  });

  const saldos = percentuaisPorCandidato
    .map((p) => ({ nome: p.nome, valor: Math.round((p.positivo - p.negativo) * 10) / 10 }))
    .sort((a, b) => b.valor - a.valor);

  const comparativo: (Paragraph | Table)[] = [
    titulo("Visão comparativa", HeadingLevel.HEADING_1),
    titulo("Volume de cobertura relevante por candidato", HeadingLevel.HEADING_2),
    tabelaRanking(volumePorCandidato, "Notícias"),
    titulo("Distribuição de sentimento por candidato (%)", HeadingLevel.HEADING_2),
    tabelaPorSentimento(
      percentuaisPorCandidato.map((p) => ({ nome: p.nome, positivo: p.positivo, negativo: p.negativo, neutro: p.neutro })),
      "Candidato",
    ),
    titulo("Saldo de sentimento por candidato (% positivo − % negativo)", HeadingLevel.HEADING_2),
    tabelaRanking(saldos, "Saldo"),
  ];

  const detalhamentos: (Paragraph | Table)[] = [];
  for (const d of dados) {
    detalhamentos.push(titulo(`Detalhamento — ${d.nome}`, HeadingLevel.HEADING_1));
    detalhamentos.push(...secaoCandidato(d.registros, d.picos, HeadingLevel.HEADING_2));
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Relatório Geral de Clipping — Todos os Candidatos", heading: HeadingLevel.TITLE }),
          new Paragraph({ children: [new TextRun({ text: `Período: ${rotuloPeriodo}`, italics: true })] }),
          new Paragraph(`Candidatos incluídos: ${nomes.join(", ")}`),
          ...comparativo,
          ...detalhamentos,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
