import { RelatorioPanel } from "./relatorio-panel";
import { getCandidatoPorSlug } from "@/server/queries/candidatos";

export default async function RelatorioPage({ params }: { params: Promise<{ candidato: string }> }) {
  const { candidato: slug } = await params;
  const candidato = await getCandidatoPorSlug(slug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Relatório semanal</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Balanço da semana (segunda a sexta) pedido pelo direcionamento da PMJP — baixe e envie
          manualmente toda sexta-feira.
        </p>
      </div>
      {candidato.tipo === "instituicao" ? (
        <RelatorioPanel candidatoId={candidato.id} candidatoSlug={slug} />
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          Esse relatório ainda é desenhado em torno da taxonomia de secretarias da PMJP — a
          versão pra candidatos (agrupando por tema em vez de secretaria) ainda não existe.
        </p>
      )}
    </div>
  );
}
