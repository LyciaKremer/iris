import "server-only";
import { Document, Packer, Paragraph, HeadingLevel, ImageRun, TextRun } from "docx";
import {
  svgBarrasHorizontais,
  svgBarrasEmpilhadas,
  svgBarrasDivergentes,
  svgPizza,
  svgLinha,
  svgBarrasVerticais,
  CORES_SENTIMENTO,
} from "@/lib/svgCharts";
import { svgParaPng } from "@/lib/rasterizarSvg";
import { formatarDataBR } from "@/lib/dates";
import type { RegistroRelatorio } from "@/server/queries/relatorioGeral";
import type { Pico } from "@/server/queries/picos";

/**
 * Porta de relatorio_graficos.py — relatório .docx com gráficos (individual
 * por candidato e comparativo entre vários), diferente do "relatório
 * semanal" já existente (esse é PMJP-only, 5 métricas fixas em tabela, sem
 * gráfico). Gráficos são SVG rasterizado em PNG via sharp (ver svgCharts.ts
 * e rasterizarSvg.ts) — sem dependência de canvas nativo/matplotlib.
 */

const LARGURA_DOC = 480; // pt — cabe na largura útil da página A4/Letter com margem padrão

function extrairDimensoes(svg: string): { largura: number; altura: number } {
  const m = svg.match(/width="(\d+)" height="(\d+)"/);
  return { largura: Number(m?.[1] ?? 700), altura: Number(m?.[2] ?? 400) };
}

async function imagemDoSvg(svg: string): Promise<ImageRun> {
  const { largura, altura } = extrairDimensoes(svg);
  const buffer = await svgParaPng(svg);
  const escala = LARGURA_DOC / largura;
  return new ImageRun({
    type: "png",
    data: buffer,
    transformation: { width: LARGURA_DOC, height: Math.round(altura * escala) },
  });
}

function titulo(texto: string, nivel: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({ text: texto, heading: nivel });
}

async function paragrafoComImagem(svg: string): Promise<Paragraph> {
  return new Paragraph({ children: [await imagemDoSvg(svg)] });
}

function secaoPicos(picos: Pico[], nivel: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph[] {
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

/** Monta os parágrafos de gráficos + picos de UM candidato — reaproveitado
 * tanto no relatório individual quanto na seção "detalhamento" do
 * comparativo. */
async function secaoCandidato(
  registros: RegistroRelatorio[],
  picos: Pico[],
  nivelTitulo: (typeof HeadingLevel)[keyof typeof HeadingLevel],
  nivelSubtitulo: (typeof HeadingLevel)[keyof typeof HeadingLevel],
): Promise<Paragraph[]> {
  const relevantes = registros.filter((r) => r.relevante);
  const paragrafos: Paragraph[] = [];

  // 1. Evolução do sentimento por dia
  const dias = [...new Set(relevantes.map((r) => r.data))].sort();
  const porSentimento = (sentimento: string) =>
    dias.map((d) => relevantes.filter((r) => r.data === d && r.sentimento === sentimento).length);
  paragrafos.push(titulo("Evolução do sentimento", nivelSubtitulo));
  paragrafos.push(
    await paragrafoComImagem(
      svgLinha(
        dias,
        Object.entries(CORES_SENTIMENTO).map(([sentimento, cor]) => ({
          rotulo: sentimento,
          valores: porSentimento(sentimento),
          cor,
        })),
        "Evolução do sentimento por dia",
      ),
    ),
  );

  // 2. Temas mais frequentes
  const contagemTemas = contarPor(relevantes, (r) => r.tema);
  paragrafos.push(titulo("Temas mais frequentes", nivelSubtitulo));
  paragrafos.push(await paragrafoComImagem(svgBarrasHorizontais(contagemTemas, "Temas mais frequentes", "#455a64")));

  // 3. Veículos que mais cobriram (top 10)
  const contagemVeiculos = contarPor(relevantes, (r) => r.veiculo).slice(0, 10);
  paragrafos.push(titulo("Veículos que mais cobriram", nivelSubtitulo));
  paragrafos.push(
    await paragrafoComImagem(svgBarrasHorizontais(contagemVeiculos, "Veículos que mais cobriram (top 10)", "#6a1b9a")),
  );

  // 4. Cidades que mais cobriram (top 10) — só se houver mapeamento
  const contagemCidades = contarPor(
    relevantes.filter((r) => r.cidade !== "Desconhecida"),
    (r) => r.cidade,
  ).slice(0, 10);
  if (contagemCidades.length > 0) {
    paragrafos.push(titulo("Cidades que mais cobriram", nivelSubtitulo));
    paragrafos.push(
      await paragrafoComImagem(
        svgBarrasHorizontais(contagemCidades, "Cidades que mais cobriram (cidade-sede do veículo, top 10)", "#00695c"),
      ),
    );
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
    paragrafos.push(titulo("Sentimento por veículo", nivelSubtitulo));
    paragrafos.push(await paragrafoComImagem(svgBarrasEmpilhadas(linhasEmpilhadas, "Sentimento por veículo")));
  }

  // 6. Volume por tipo de veículo (pizza)
  const coresTipo: Record<string, string> = { Rádio: "#455a64", Televisão: "#6a1b9a", Online: "#00695c" };
  const contagemTipos = contarPor(registros, (r) => r.tipo);
  paragrafos.push(titulo("Volume por tipo de veículo", nivelSubtitulo));
  paragrafos.push(
    await paragrafoComImagem(
      svgPizza(
        contagemTipos.map((t) => ({ nome: t.nome, valor: t.valor, cor: coresTipo[t.nome] ?? "#999" })),
        "Volume por tipo de veículo",
      ),
    ),
  );

  // 7. Volume diário, com picos destacados
  const datasPico = new Set(picos.map((p) => p.data));
  const volumePorDia = dias.map((d) => ({
    rotulo: d,
    valor: relevantes.filter((r) => r.data === d).length,
    destaque: datasPico.has(d),
  }));
  if (volumePorDia.length > 0) {
    paragrafos.push(titulo("Volume diário", nivelSubtitulo));
    paragrafos.push(
      await paragrafoComImagem(svgBarrasVerticais(volumePorDia, "Volume diário de notícias (picos em vermelho)")),
    );
  }

  paragrafos.push(...secaoPicos(picos, nivelSubtitulo));

  return paragrafos;
}

function contarPor<T>(itens: T[], chave: (item: T) => string): { nome: string; valor: number }[] {
  const contagem = new Map<string, number>();
  for (const item of itens) {
    const k = chave(item);
    contagem.set(k, (contagem.get(k) ?? 0) + 1);
  }
  return [...contagem.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
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

  const corpo = await secaoCandidato(registros, picos, HeadingLevel.HEADING_1, HeadingLevel.HEADING_1);

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
 * detalhamento individual (gráficos + picos) por candidato ao final —
 * porta de gerar_relatorio_geral() em relatorio_graficos.py. */
export async function gerarRelatorioGeralDocx(rotuloPeriodo: string, dados: DadosCandidatoRelatorio[]): Promise<Buffer> {
  const nomes = dados.map((d) => d.nome);

  const volumePorCandidato = dados
    .map((d) => ({ nome: d.nome, valor: d.registros.filter((r) => r.relevante).length }))
    .sort((a, b) => b.valor - a.valor);

  const percentuaisPorCandidato = dados.map((d) => {
    const relevantes = d.registros.filter((r) => r.relevante);
    const total = relevantes.length || 1;
    const pct = (sentimento: string) =>
      (relevantes.filter((r) => r.sentimento === sentimento).length / total) * 100;
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

  const comparativo: Paragraph[] = [
    titulo("Visão comparativa", HeadingLevel.HEADING_1),
    titulo("Volume de cobertura por candidato", HeadingLevel.HEADING_2),
    await paragrafoComImagem(svgBarrasHorizontais(volumePorCandidato, "Volume de cobertura relevante por candidato", "#37474f")),
    titulo("Distribuição de sentimento por candidato", HeadingLevel.HEADING_2),
    await paragrafoComImagem(svgBarrasEmpilhadas(linhasDistribuicao, "Distribuição de sentimento por candidato (%)", true)),
    titulo("Saldo de sentimento por candidato", HeadingLevel.HEADING_2),
    await paragrafoComImagem(svgBarrasDivergentes(saldos, "Saldo de sentimento por candidato", "% positivo − % negativo")),
  ];

  const detalhamentos: Paragraph[] = [];
  for (const d of dados) {
    detalhamentos.push(titulo(`Detalhamento — ${d.nome}`, HeadingLevel.HEADING_1));
    detalhamentos.push(...(await secaoCandidato(d.registros, d.picos, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2)));
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
