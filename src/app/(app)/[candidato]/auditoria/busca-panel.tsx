"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, ChevronUp, ChevronDown, TriangleAlert, ExternalLink } from "lucide-react";
import { buscarNoticiasAction } from "@/server/actions/auditoria";
import { formatarDataHoraBR } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Resultado = Awaited<ReturnType<typeof buscarNoticiasAction>>[number];

export function BuscaPanel({
  candidatoId,
  rotuloClassificacao,
}: {
  candidatoId: string;
  rotuloClassificacao: "Secretaria" | "Tema";
}) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [pending, startTransition] = useTransition();

  function buscar() {
    if (!termo.trim()) return;
    startTransition(async () => {
      const dados = await buscarNoticiasAction(candidatoId, termo);
      setResultados(dados);
      if (dados.length === 0) toast.info("Nenhuma notícia encontrada.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          placeholder="Id, veículo, trecho do resumo ou da transcrição…"
          className="flex-1"
        />
        <Button onClick={buscar} loading={pending} disabled={!termo.trim()}>
          <Search className="h-4 w-4" /> {pending ? "Buscando…" : "Buscar"}
        </Button>
      </div>

      {resultados && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            {resultados.length} resultado(s){resultados.length === 50 && " (mostrando os 50 mais recentes)"}.
          </p>
          {resultados.map((n) => (
            <DetalheNoticia key={n.id} noticia={n} rotuloClassificacao={rotuloClassificacao} />
          ))}
        </div>
      )}
    </div>
  );
}

function DetalheNoticia({
  noticia,
  rotuloClassificacao,
}: {
  noticia: Resultado;
  rotuloClassificacao: "Secretaria" | "Tema";
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
      <button
        onClick={() => setAberto(!aberto)}
        className="flex w-full cursor-pointer items-center justify-between text-left"
      >
        <span>
          <span className="font-medium">{noticia.veiculo}</span>{" "}
          <span className="text-[var(--muted-foreground)]">
            · {noticia.tipoVeiculo} · {formatarDataHoraBR(noticia.dataPublicacao)}
          </span>
        </span>
        {aberto ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
        )}
      </button>

      {aberto && (
        <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
          <Campo label="Id da notícia" valor={noticia.noticiaId} />
          <Campo label="Data de execução (dia importado)" valor={noticia.dataExecucao} />
          <Campo label="Sentimento original → final" valor={`${noticia.sentimentoOriginal} → ${noticia.sentimentoFinal ?? "—"}`} />
          <Campo label={rotuloClassificacao} valor={noticia.secretaria ?? "—"} />
          <Campo label="Relevante" valor={noticia.relevante === null ? "ainda não processado" : noticia.relevante ? "sim" : "não"} />
          <Campo label="Revisado manualmente" valor={noticia.revisadoManualmente ? "sim" : "não"} />
          {noticia.urlMidia && (
            <p>
              <span className="font-medium text-[var(--muted-foreground)]">Mídia:</span>{" "}
              <a
                href={noticia.urlMidia}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                abrir áudio/vídeo original <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
          )}

          {noticia.revisadoPelaIa && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-2">
              <p className="flex items-center gap-1.5 font-medium">
                <TriangleAlert className="h-4 w-4 shrink-0 text-[var(--negative)]" /> Corrigido
                automaticamente pela IA
              </p>
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
