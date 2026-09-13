import Link from "next/link";
import { listarDatasExecucao } from "@/server/queries/noticias";

export default async function DashboardPage() {
  const datas = await listarDatasExecucao();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Início</h1>

      <div className="rounded-md border border-[var(--border)] p-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          Fluxo: <Link href="/importar" className="underline">importar</Link> o export do dia →{" "}
          <Link href="/revisar" className="underline">gerar e revisar</Link> os resumos →{" "}
          <Link href="/exportar" className="underline">exportar</Link> o JSON pro disparo local no WhatsApp.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-[var(--muted-foreground)]">Datas com notícias importadas</h2>
        {datas.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma importação ainda.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {datas.map((data) => (
              <li key={data}>
                <Link href={`/revisar?data=${data}`} className="underline">
                  {data}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
