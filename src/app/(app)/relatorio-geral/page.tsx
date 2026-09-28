import { listarCandidatosAtivos } from "@/server/queries/candidatos";
import { RelatorioGeralPanel } from "./relatorio-geral-panel";

export default async function RelatorioGeralPage() {
  const candidatos = await listarCandidatosAtivos();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Relatório geral (.docx com gráficos)</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Relatório .docx com gráficos de evolução de sentimento, temas, veículos, cidades e
          picos de volume — individual (um candidato) ou comparativo (vários de uma vez).
        </p>
      </div>
      <RelatorioGeralPanel candidatos={candidatos.map((c) => ({ id: c.id, nome: c.nome }))} />
    </div>
  );
}
