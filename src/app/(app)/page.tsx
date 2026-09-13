import Link from "next/link";
import { listarDatasExecucao } from "@/server/queries/noticias";
import { formatarDataBR } from "@/lib/dates";

export default async function DashboardPage() {
  const datas = await listarDatasExecucao();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Início</h1>

      <div className="space-y-2 rounded-md border border-[var(--border)] p-4 text-sm">
        <p>
          <strong>1. Importar</strong> — cola o JSON exportado da plataforma de clipping (uma
          página por vez, acumula sem duplicar).
        </p>
        <p>
          <strong>2. Revisar</strong> — clica em "Processar" em cada notícia (ou "Processar
          todas") pra gerar o resumo, sentimento e secretaria via IA; dá pra corrigir manualmente
          o que a IA errar.
        </p>
        <p>
          <strong>3. Exportar</strong> — depois que tudo estiver processado, gera o JSON de
          mensagens no formato final, pra alimentar o disparo local no WhatsApp.
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
                  {formatarDataBR(data)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
