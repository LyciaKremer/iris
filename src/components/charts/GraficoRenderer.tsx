import type { EspecificacaoGrafico } from "@/lib/relatorioGraficosDados";
import { RankingBars } from "./RankingBars";
import { SentimentStackedBars } from "./SentimentStackedBars";
import { SaldoSentimentoBars } from "./SaldoSentimentoBars";
import { TipoVeiculoDonut } from "./TipoVeiculoDonut";
import { SentimentoLineChart } from "./SentimentoLineChart";
import { VolumeDiarioBars } from "./VolumeDiarioBars";

export function GraficoRenderer({ grafico }: { grafico: EspecificacaoGrafico }) {
  switch (grafico.tipo) {
    case "ranking":
      return <RankingBars dados={grafico.dados} />;
    case "sentimentoEmpilhado":
      return <SentimentStackedBars linhas={grafico.linhas} percentual={grafico.percentual} />;
    case "saldoSentimento":
      return <SaldoSentimentoBars dados={grafico.dados} />;
    case "tipoVeiculoDonut":
      return <TipoVeiculoDonut dados={grafico.dados} />;
    case "linhaSentimento":
      return (
        <SentimentoLineChart
          eixoX={grafico.eixoX}
          positivo={grafico.positivo}
          negativo={grafico.negativo}
          neutro={grafico.neutro}
        />
      );
    case "volumeDiario":
      return <VolumeDiarioBars dados={grafico.dados} />;
  }
}
