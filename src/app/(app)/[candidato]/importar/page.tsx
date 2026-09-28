import { ImportForm } from "./import-form";
import { getCandidatoPorSlug } from "@/server/queries/candidatos";

export default async function ImportarPage({ params }: { params: Promise<{ candidato: string }> }) {
  const { candidato: slug } = await params;
  const candidato = await getCandidatoPorSlug(slug);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Importar clipping — {candidato.nome}</h1>
      <ImportForm candidatoId={candidato.id} candidatoSlug={slug} />
    </div>
  );
}
