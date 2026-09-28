import Link from "next/link";
import { listarDatasExecucao } from "@/server/queries/noticias";
import { getCandidatoPorSlug } from "@/server/queries/candidatos";
import { ExportPanel } from "./export-panel";
import { ExportarBaseCompleta } from "./exportar-base-completa";
import { DisparoAvulsoPanel } from "./disparo-avulso-panel";

export default async function ExportarPage({ params }: { params: Promise<{ candidato: string }> }) {
  const { candidato: slug } = await params;
  const candidato = await getCandidatoPorSlug(slug);
  const datas = await listarDatasExecucao(candidato.id);

  if (datas.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Exportar</h1>
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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Exportar pro disparo local</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Gera o JSON de mensagens no formato que o script local (disparar_mensagens.py) vai
        consumir pra disparar. Escolha o dia e o envio — filtra pela data de publicação real da
        notícia, não pela data que você importou. Só funciona depois que todas as notícias desse
        período já foram processadas em &quot;Revisar&quot;.
      </p>
      <ExportPanel candidatoId={candidato.id} tipo={candidato.tipo as "pessoa" | "instituicao"} />
      <DisparoAvulsoPanel candidatoId={candidato.id} />
      <ExportarBaseCompleta candidatoId={candidato.id} candidatoSlug={slug} />
    </div>
  );
}
