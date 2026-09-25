import Link from "next/link";
import { listarResumoPorData } from "@/server/queries/noticias";
import { formatarDataBR } from "@/lib/dates";

export default async function DashboardPage() {
  const dias = await listarResumoPorData();

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
        <h2 className="mb-2 text-sm font-medium text-[var(--muted-foreground)]">Dias importados</h2>
        {dias.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma importação ainda.</p>
        ) : (
          <div className="space-y-2">
            {dias.map((dia) => {
              const tudoPronto = dia.pendentes === 0;
              return (
                <div
                  key={dia.dataExecucao}
                  className="flex items-center justify-between rounded-md border border-[var(--border)] p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{formatarDataBR(dia.dataExecucao)}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {dia.total} notícia(s)
                      {tudoPronto ? (
                        <span className="text-[var(--positive)]"> · tudo processado</span>
                      ) : (
                        <span className="text-[var(--negative)]"> · {dia.pendentes} pendente(s)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <Link
                      href={`/revisar?data=${dia.dataExecucao}`}
                      className="rounded-md border border-[var(--border)] px-3 py-1 hover:bg-[var(--muted)]"
                    >
                      Revisar
                    </Link>
                    <Link
                      href="/exportar"
                      className="rounded-md border border-[var(--border)] px-3 py-1 hover:bg-[var(--muted)]"
                    >
                      Exportar
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
