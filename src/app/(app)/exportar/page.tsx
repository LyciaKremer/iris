import Link from "next/link";
import { listarDatasExecucao } from "@/server/queries/noticias";
import { ExportPanel } from "./export-panel";

export default async function ExportarPage() {
  const datas = await listarDatasExecucao();

  if (datas.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Exportar</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Nenhuma notícia importada ainda. <Link href="/importar" className="underline">Importar agora</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Exportar pro disparo local</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Gera o JSON de mensagens no formato que o script local (main.py / whatsapp.py) vai consumir pra disparar.
      </p>
      <ExportPanel datas={datas} />
    </div>
  );
}
