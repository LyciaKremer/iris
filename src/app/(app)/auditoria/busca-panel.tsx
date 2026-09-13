"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { buscarNoticiasAction } from "@/server/actions/auditoria";
import { formatarDataBR } from "@/lib/dates";
import { RainbowLoader } from "@/components/rainbow-loader";

type Resultado = Awaited<ReturnType<typeof buscarNoticiasAction>>[number];

export function BuscaPanel() {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [pending, startTransition] = useTransition();

  function buscar() {
    if (!termo.trim()) return;
    startTransition(async () => {
      const dados = await buscarNoticiasAction(termo);
      setResultados(dados);
      if (dados.length === 0) toast.info("Nenhuma notícia encontrada.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          placeholder="Id, veículo, trecho do resumo ou da transcrição…"
          className="h-9 flex-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm"
        />
        <button
          onClick={buscar}
          disabled={pending || !termo.trim()}
          className="flex h-9 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {pending && <RainbowLoader size={14} />}
          {pending ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {resultados && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            {resultados.length} resultado(s){resultados.length === 50 && " (mostrando os 50 mais recentes)"}.
          </p>
          {resultados.map((n) => (
            <DetalheNoticia key={n.id} noticia={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function DetalheNoticia({ noticia }: { noticia: Resultado }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="rounded-md border border-[var(--border)] p-4 text-sm">
      <button onClick={() => setAberto(!aberto)} className="flex w-full items-center justify-between text-left">
        <span>
          <span className="font-medium">{noticia.veiculo}</span>{" "}
          <span className="text-[var(--muted-foreground)]">
            · {noticia.tipoVeiculo} · {formatarDataBR(noticia.dataPublicacao.toISOString().slice(0, 10))}
          </span>
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">{aberto ? "▲" : "▼"}</span>
      </button>

      {aberto && (
        <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
          <Campo label="Id da notícia" valor={noticia.noticiaId} />
          <Campo label="Data de execução (dia importado)" valor={noticia.dataExecucao} />
          <Campo label="Sentimento original → final" valor={`${noticia.sentimentoOriginal} → ${noticia.sentimentoFinal ?? "—"}`} />
          <Campo label="Secretaria" valor={noticia.secretaria ?? "—"} />
          <Campo label="Relevante" valor={noticia.relevante === null ? "ainda não processado" : noticia.relevante ? "sim" : "não"} />
          <Campo label="Revisado manualmente" valor={noticia.revisadoManualmente ? "sim" : "não"} />

          {noticia.revisadoPelaIa && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-2">
              <p className="font-medium">⚠️ Corrigido automaticamente pela IA</p>
              {noticia.problemaDetectado && <p className="mt-1">{noticia.problemaDetectado}</p>}
              {noticia.resumoOriginal && (
                <p className="mt-1 italic text-[var(--muted-foreground)]">Original: {noticia.resumoOriginal}</p>
              )}
            </div>
          )}

          <div>
            <p className="font-medium text-[var(--muted-foreground)]">Título original</p>
            <p className="mt-1">{noticia.tituloOriginal || "—"}</p>
          </div>

          <div>
            <p className="font-medium text-[var(--muted-foreground)]">Resumo</p>
            <p className="mt-1">{noticia.resumo || "—"}</p>
          </div>

          <div>
            <p className="font-medium text-[var(--muted-foreground)]">Transcrição completa</p>
            <p className="mt-1 whitespace-pre-wrap text-[var(--muted-foreground)]">
              {noticia.transcricao || "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <p>
      <span className="font-medium text-[var(--muted-foreground)]">{label}:</span> {valor}
    </p>
  );
}
