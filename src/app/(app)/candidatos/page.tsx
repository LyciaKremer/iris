import { listarCandidatosTodos } from "@/server/queries/candidatos";
import { NovoCandidatoForm } from "./novo-candidato-form";
import { CandidatoRow } from "./candidato-row";
import { ProcessamentoLote } from "./processamento-lote";

export default async function CandidatosPage() {
  const candidatos = await listarCandidatosTodos();
  const ativos = candidatos.filter((c) => c.ativo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Candidatos</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Cada candidato é um monitorado independente — pessoa (candidato político) ou
            instituição. O tipo decide os prompts de IA e a grade de horários usados pra ele, e não
            muda depois de criado.
          </p>
        </div>
        <NovoCandidatoForm />
      </div>

      <div className="space-y-2">
        {candidatos.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Nenhum candidato cadastrado ainda.</p>
        ) : (
          candidatos.map((c) => <CandidatoRow key={c.id} candidato={c} />)
        )}
      </div>

      <ProcessamentoLote
        candidatos={ativos.map((c) => ({
          id: c.id,
          slug: c.slug,
          nome: c.nome,
          tipo: c.tipo as "pessoa" | "instituicao",
        }))}
      />
    </div>
  );
}
