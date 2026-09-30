import Link from "next/link";
import { listarDatasExecucao, listarPorData } from "@/server/queries/noticias";
import { getCandidatoPorSlug } from "@/server/queries/candidatos";
import { RevisarLista } from "./revisar-lista";
import { DateSelect } from "./date-select";
import { ProcessarTodas } from "./processar-todas";
import { formatarDataBR } from "@/lib/dates";

export default async function RevisarPage({
  params,
  searchParams,
}: {
  params: Promise<{ candidato: string }>;
  searchParams: Promise<{ data?: string }>;
}) {
  const { candidato: slug } = await params;
  const candidato = await getCandidatoPorSlug(slug);
  const { data: dataParam } = await searchParams;
  const datas = await listarDatasExecucao(candidato.id);
  const dataAtual = dataParam ?? datas[0];

  if (!dataAtual) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Revisar</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Nenhuma notícia importada ainda.{" "}
          <Link href={`/${slug}/importar`} className="underline">
            Importar agora
          </Link>
          .
        </p>
      </div>
    );
  }

  const noticias = await listarPorData(candidato.id, dataAtual);
  const idsPendentes = noticias.filter((n) => n.resumo === null).map((n) => n.id);
  const rotuloClassificacao = candidato.tipo === "instituicao" ? "secretaria" : "tema";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Revisar — {formatarDataBR(dataAtual)}</h1>
        {datas.length > 1 && <DateSelect datas={datas} atual={dataAtual} />}
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        &quot;Processar&quot; gera o resumo, sentimento e {rotuloClassificacao} via IA a partir da
        transcrição. Você pode corrigir qualquer campo manualmente depois em &quot;Editar&quot;.
      </p>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          {noticias.length} notícia(s) — {idsPendentes.length} pendente(s) de processamento.
        </p>
        <ProcessarTodas ids={idsPendentes} />
      </div>

      <RevisarLista
        noticias={noticias}
        rotuloClassificacao={rotuloClassificacao}
        dataAtual={dataAtual}
        tipoCandidato={candidato.tipo as "pessoa" | "instituicao"}
      />
    </div>
  );
}
