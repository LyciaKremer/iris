import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { formatarDataBR } from "@/lib/dates";
import type { RelatorioSemanal, RankingItem, FatiaPercentual } from "@/lib/relatorioSemanal";

function celula(texto: string): TableCell {
  return new TableCell({ children: [new Paragraph(texto)] });
}

function tabelaRanking(itens: RankingItem[], rotuloQuantidade: string): Table | Paragraph {
  if (itens.length === 0) return new Paragraph("Nenhum registro no período.");

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [celula("Nome"), celula(rotuloQuantidade)] }),
      ...itens.map((item) => new TableRow({ children: [celula(item.nome), celula(String(item.quantidade))] })),
    ],
  });
}

function tabelaPercentual(itens: FatiaPercentual[]): Table | Paragraph {
  if (itens.length === 0) return new Paragraph("Nenhum registro no período.");

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [celula("Secretaria/assunto"), celula("Menções"), celula("%")] }),
      ...itens.map(
        (item) =>
          new TableRow({
            children: [celula(item.nome), celula(String(item.quantidade)), celula(`${item.percentual}%`)],
          }),
      ),
    ],
  });
}

export async function gerarRelatorioDocx(relatorio: RelatorioSemanal): Promise<Buffer> {
  const { periodo } = relatorio;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Relatório Semanal — PMJP", heading: HeadingLevel.TITLE }),
          new Paragraph(`Período: ${formatarDataBR(periodo.inicio)} a ${formatarDataBR(periodo.fim)}`),
          new Paragraph(`Total de notícias relevantes no período: ${relatorio.totalNoticias}`),

          new Paragraph({ text: "1. Veículos com mais cobertura — Rádio", heading: HeadingLevel.HEADING_1 }),
          tabelaRanking(relatorio.veiculosPorTipo["Rádio"] ?? [], "Notícias"),

          new Paragraph({ text: "Veículos com mais cobertura — Televisão", heading: HeadingLevel.HEADING_2 }),
          tabelaRanking(relatorio.veiculosPorTipo["Televisão"] ?? [], "Notícias"),

          new Paragraph({ text: "2. Veículos com mais sinalizações negativas", heading: HeadingLevel.HEADING_1 }),
          tabelaRanking(relatorio.veiculosNegativos, "Negativas"),

          new Paragraph({ text: "3. Secretarias/assuntos com mais pontos negativos", heading: HeadingLevel.HEADING_1 }),
          tabelaRanking(relatorio.secretariasNegativas, "Negativas"),

          new Paragraph({ text: "4. Pontos positivos mais relevantes", heading: HeadingLevel.HEADING_1 }),
          tabelaRanking(relatorio.secretariasPositivas, "Positivas"),

          new Paragraph({ text: "5. Percentual de menções por secretaria/assunto", heading: HeadingLevel.HEADING_1 }),
          tabelaPercentual(relatorio.percentualPorSecretaria),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
