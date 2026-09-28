import Link from "next/link";
import { listarCandidatosAtivos } from "@/server/queries/candidatos";

export default async function SeletorCandidatoPage() {
  const candidatos = await listarCandidatosAtivos();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Selecione um candidato</h1>

      {candidatos.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Nenhum candidato cadastrado ainda.{" "}
          <Link href="/candidatos" className="underline">
            Cadastrar o primeiro
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {candidatos.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="rounded-md border border-[var(--border)] p-4 hover:bg-[var(--muted)]"
            >
              <p className="font-medium">{c.nome}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {c.tipo === "instituicao" ? "Instituição" : "Pessoa"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
