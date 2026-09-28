import { getCandidatoPorSlug } from "@/server/queries/candidatos";
import { PicosPanel } from "./picos-panel";

export default async function PicosPage({ params }: { params: Promise<{ candidato: string }> }) {
  const { candidato: slug } = await params;
  const candidato = await getCandidatoPorSlug(slug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Picos de volume</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Compara o volume de notícias relevantes de cada dia com a média do mesmo dia da semana
          nas semanas anteriores — ajuda a distinguir cobertura jornalística de verdade de um dia
          comum.
        </p>
      </div>
      <PicosPanel candidatoId={candidato.id} />
    </div>
  );
}
