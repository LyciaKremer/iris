import { BuscaPanel } from "./busca-panel";
import { getCandidatoPorSlug } from "@/server/queries/candidatos";

export default async function AuditoriaPage({ params }: { params: Promise<{ candidato: string }> }) {
  const { candidato: slug } = await params;
  const candidato = await getCandidatoPorSlug(slug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Auditoria</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Busca uma notícia por id, veículo, trecho do resumo ou da transcrição, e mostra todos
          os detalhes — inclusive se foi corrigida pela IA ou revisada manualmente.
        </p>
      </div>
      <BuscaPanel
        candidatoId={candidato.id}
        rotuloClassificacao={candidato.tipo === "instituicao" ? "Secretaria" : "Tema"}
      />
    </div>
  );
}
