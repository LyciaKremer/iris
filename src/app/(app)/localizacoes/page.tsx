import { prisma } from "@/lib/prisma";
import { ImportarLocalizacoesForm } from "./importar-form";
import { LocalizacaoRow } from "./localizacao-row";

export default async function LocalizacoesPage() {
  const localizacoes = await prisma.veiculoLocalizacao.findMany({ orderBy: { veiculo: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Localizações</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Mapeamento manual da cidade-sede de cada veículo (de onde ele transmite, não
          necessariamente a cidade sobre a qual a notícia fala) — usado nos gráficos de cobertura
          por cidade e na detecção de picos. Global pra todos os candidatos, já que a mesma rádio
          tem a mesma cidade-sede pra qualquer um deles.
        </p>
      </div>

      <ImportarLocalizacoesForm />

      <div className="space-y-2">
        <p className="text-sm text-[var(--muted-foreground)]">{localizacoes.length} veículo(s) mapeado(s).</p>
        {localizacoes.map((l) => (
          <LocalizacaoRow key={l.veiculo} localizacao={l} />
        ))}
      </div>
    </div>
  );
}
