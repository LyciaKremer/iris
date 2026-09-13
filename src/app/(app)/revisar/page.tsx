import Link from "next/link";
import { listarDatasExecucao, listarPorData } from "@/server/queries/noticias";
import { NoticiaRow } from "./noticia-row";
import { DateSelect } from "./date-select";
import { ProcessarTodas } from "./processar-todas";

export default async function RevisarPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data: dataParam } = await searchParams;
  const datas = await listarDatasExecucao();
  const dataAtual = dataParam ?? datas[0];

  if (!dataAtual) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Revisar</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Nenhuma notícia importada ainda. <Link href="/importar" className="underline">Importar agora</Link>.
        </p>
      </div>
    );
  }

  const noticias = await listarPorData(dataAtual);
  const idsPendentes = noticias.filter((n) => n.resumo === null).map((n) => n.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Revisar — {dataAtual}</h1>
        {datas.length > 1 && <DateSelect datas={datas} atual={dataAtual} />}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          {noticias.length} notícia(s) — {idsPendentes.length} pendente(s) de processamento.
        </p>
        <ProcessarTodas ids={idsPendentes} />
      </div>

      <div className="space-y-3">
        {noticias.map((noticia) => (
          <NoticiaRow key={noticia.id} noticia={noticia} />
        ))}
      </div>
    </div>
  );
}
