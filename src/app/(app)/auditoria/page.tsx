import { BuscaPanel } from "./busca-panel";

export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Auditoria</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Busca uma notícia por id, veículo, trecho do resumo ou da transcrição, e mostra todos
          os detalhes — inclusive se foi corrigida pela IA ou revisada manualmente.
        </p>
      </div>
      <BuscaPanel />
    </div>
  );
}
