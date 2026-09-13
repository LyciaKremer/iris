import Link from "next/link";
import { listarDatasExecucao, listarPorData } from "@/server/queries/noticias";
import { NoticiaRow } from "./noticia-row";
import { DateSelect } from "./date-select";

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
  const pendentes = noticias.filter((n) => n.resumo === null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Revisar — {dataAtual}</h1>
        {datas.length > 1 && <DateSelect datas={datas} atual={dataAtual} />}
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        {noticias.length} notícia(s) — {pendentes} pendente(s) de processamento.
      </p>

      <div className="space-y-3">
        {noticias.map((noticia) => (
          <NoticiaRow key={noticia.id} noticia={noticia} />
        ))}
      </div>
    </div>
  );
}
