import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatarDataBR } from "@/lib/dates";
import type { RelatorioSemanal, RankingItem, FatiaPercentual } from "@/lib/relatorioSemanal";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10 },
  titulo: { fontSize: 18, marginBottom: 4 },
  meta: { fontSize: 10, color: "#555", marginBottom: 2 },
  secao: { fontSize: 13, marginTop: 16, marginBottom: 6 },
  linha: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 3,
  },
  cabecalho: { fontWeight: 700 },
  colNome: { flex: 3 },
  colValor: { flex: 1, textAlign: "right" },
  vazio: { color: "#777", fontStyle: "italic" },
});

function TabelaRanking({ itens, rotulo }: { itens: RankingItem[]; rotulo: string }) {
  if (itens.length === 0) return <Text style={styles.vazio}>Nenhum registro no período.</Text>;
  return (
    <View>
      <View style={[styles.linha, styles.cabecalho]}>
        <Text style={styles.colNome}>Nome</Text>
        <Text style={styles.colValor}>{rotulo}</Text>
      </View>
      {itens.map((item) => (
        <View style={styles.linha} key={item.nome}>
          <Text style={styles.colNome}>{item.nome}</Text>
          <Text style={styles.colValor}>{item.quantidade}</Text>
        </View>
      ))}
    </View>
  );
}

function TabelaPercentual({ itens }: { itens: FatiaPercentual[] }) {
  if (itens.length === 0) return <Text style={styles.vazio}>Nenhum registro no período.</Text>;
  return (
    <View>
      <View style={[styles.linha, styles.cabecalho]}>
        <Text style={styles.colNome}>Secretaria/assunto</Text>
        <Text style={styles.colValor}>Menções</Text>
        <Text style={styles.colValor}>%</Text>
      </View>
      {itens.map((item) => (
        <View style={styles.linha} key={item.nome}>
          <Text style={styles.colNome}>{item.nome}</Text>
          <Text style={styles.colValor}>{item.quantidade}</Text>
          <Text style={styles.colValor}>{item.percentual}%</Text>
        </View>
      ))}
    </View>
  );
}

function RelatorioDocument({ relatorio }: { relatorio: RelatorioSemanal }) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.titulo}>Relatório Semanal — PMJP</Text>
        <Text style={styles.meta}>
          Período: {formatarDataBR(relatorio.periodo.inicio)} a {formatarDataBR(relatorio.periodo.fim)}
        </Text>
        <Text style={styles.meta}>Total de notícias relevantes no período: {relatorio.totalNoticias}</Text>

        <Text style={styles.secao}>1. Veículos com mais cobertura — Rádio</Text>
        <TabelaRanking itens={relatorio.veiculosPorTipo["Rádio"] ?? []} rotulo="Notícias" />

        <Text style={styles.secao}>Veículos com mais cobertura — Televisão</Text>
        <TabelaRanking itens={relatorio.veiculosPorTipo["Televisão"] ?? []} rotulo="Notícias" />

        <Text style={styles.secao}>2. Veículos com mais sinalizações negativas</Text>
        <TabelaRanking itens={relatorio.veiculosNegativos} rotulo="Negativas" />

        <Text style={styles.secao}>3. Secretarias/assuntos com mais pontos negativos</Text>
        <TabelaRanking itens={relatorio.secretariasNegativas} rotulo="Negativas" />

        <Text style={styles.secao}>4. Pontos positivos mais relevantes</Text>
        <TabelaRanking itens={relatorio.secretariasPositivas} rotulo="Positivas" />

        <Text style={styles.secao}>5. Percentual de menções por secretaria/assunto</Text>
        <TabelaPercentual itens={relatorio.percentualPorSecretaria} />
      </Page>
    </Document>
  );
}

export async function gerarRelatorioPdf(relatorio: RelatorioSemanal): Promise<Buffer> {
  return renderToBuffer(<RelatorioDocument relatorio={relatorio} />);
}
