import { RelatorioPanel } from "./relatorio-panel";

export default function RelatorioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Relatório semanal</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Balanço da semana (segunda a sexta) pedido pelo direcionamento da PMJP — baixe e envie
          manualmente toda sexta-feira.
        </p>
      </div>
      <RelatorioPanel />
    </div>
  );
}
