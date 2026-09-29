import Link from "next/link";
import { listarResumoPorData } from "@/server/queries/noticias";
import { getCandidatoPorSlug } from "@/server/queries/candidatos";
import { formatarDataBR } from "@/lib/dates";
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardPage({ params }: { params: Promise<{ candidato: string }> }) {
  const { candidato: slug } = await params;
  const candidato = await getCandidatoPorSlug(slug);
  const dias = await listarResumoPorData(candidato.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Início — {candidato.nome}</h1>

      <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
        <p>
          <strong>1. Importar</strong> — cola o JSON exportado da plataforma de clipping (uma
          página por vez, acumula sem duplicar).
        </p>
        <p>
          <strong>2. Revisar</strong> — clica em &quot;Processar&quot; em cada notícia (ou
          &quot;Processar todas&quot;) pra gerar o resumo, sentimento e{" "}
          {candidato.tipo === "instituicao" ? "secretaria" : "tema"} via
          IA; dá pra corrigir manualmente o que a IA errar.
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
                  className="flex items-center justify-between rounded-md border border-l-4 border-[var(--border)] bg-[var(--card)] p-3"
                  style={{ borderLeftColor: tudoPronto ? "var(--positive)" : "var(--negative)" }}
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
                  <div className="flex gap-2">
                    <Link href={`/${slug}/revisar?data=${dia.dataExecucao}`} className={buttonVariants("outline", "sm")}>
                      Revisar
                    </Link>
                    <Link href={`/${slug}/exportar`} className={buttonVariants("outline", "sm")}>
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
