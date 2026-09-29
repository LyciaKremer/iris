"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { processarItemAction } from "@/server/actions/processar";
import { salvarRevisaoAction } from "@/server/actions/revisar";
import { formatarDataHoraBR } from "@/lib/dates";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";

export type NoticiaVM = {
  id: string;
  veiculo: string;
  tipoVeiculo: string;
  tituloOriginal: string;
  sentimentoOriginal: string;
  dataPublicacao: Date;
  transcricao: string | null;
  urlMidia: string | null;
  resumo: string | null;
  relevante: boolean | null;
  sentimentoFinal: string | null;
  secretaria: string | null;
  revisadoManualmente: boolean;
  revisadoPelaIa: boolean;
  resumoOriginal: string | null;
  problemaDetectado: string | null;
};

const SENTIMENTOS = ["Positivo", "Negativo", "Neutro"];

function corSentimento(sentimento: string | null): string {
  if (sentimento === "Positivo") return "var(--positive)";
  if (sentimento === "Negativo") return "var(--negative)";
  return "var(--neutro)";
}

function Badge({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: cor, color: cor }}
    >
      {children}
    </span>
  );
}

export function NoticiaRow({
  noticia,
  rotuloClassificacao,
}: {
  noticia: NoticiaVM;
  rotuloClassificacao: "secretaria" | "tema";
}) {
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [mostrarTranscricao, setMostrarTranscricao] = useState(false);

  const processado = noticia.resumo !== null;
  const naoRelevante = noticia.relevante === false;
  const corBorda = processado
    ? naoRelevante
      ? "var(--border)"
      : corSentimento(noticia.sentimentoFinal)
    : "var(--border)";

  function processar() {
    startTransition(async () => {
      const resultado = await processarItemAction(noticia.id);
      if (!resultado.ok) toast.error(resultado.message ?? "Falha ao processar.");
    });
  }

  return (
    <div
      className="rounded-md border border-l-4 border-[var(--border)] p-4"
      style={{ borderLeftColor: corBorda }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm">
          <span className="font-medium">{noticia.veiculo}</span>{" "}
          <span className="text-[var(--muted-foreground)]">
            · {noticia.tipoVeiculo} · {formatarDataHoraBR(noticia.dataPublicacao)}
          </span>
        </div>
        {!processado && (
          <Button onClick={processar} loading={pending} size="sm" className="shrink-0">
            {pending ? "Processando…" : "Processar"}
          </Button>
        )}
      </div>

      {!processado ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)] italic">Ainda não processado.</p>
      ) : editando ? (
        <EditForm noticia={noticia} rotuloClassificacao={rotuloClassificacao} onDone={() => setEditando(false)} />
      ) : (
        <div className="mt-2 space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            {naoRelevante ? (
              <Badge cor="var(--muted-foreground)">Não relevante</Badge>
            ) : (
              <Badge cor={corSentimento(noticia.sentimentoFinal)}>{noticia.sentimentoFinal}</Badge>
            )}
            {/* Tema/secretaria só aparece pra prefeitura — pra candidatos ele
                nunca vai pro corpo do resumo/mensagem (só existe pro
                relatório de assuntos), então também não aparece aqui. */}
            {rotuloClassificacao === "secretaria" && (
              <Badge cor="var(--muted-foreground)">{noticia.secretaria}</Badge>
            )}
            {noticia.revisadoManualmente && <Badge cor="var(--muted-foreground)">revisado manualmente</Badge>}
            {noticia.revisadoPelaIa && <Badge cor="var(--muted-foreground)">⚠️ corrigido pela IA</Badge>}
          </div>

          {naoRelevante ? (
            <p className="text-[var(--muted-foreground)] italic">Sem informação relevante.</p>
          ) : (
            <p>{noticia.resumo}</p>
          )}

          {noticia.revisadoPelaIa && (noticia.problemaDetectado || noticia.resumoOriginal) && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-2 text-xs">
              {noticia.problemaDetectado && <p>{noticia.problemaDetectado}</p>}
              {noticia.resumoOriginal && (
                <p className="mt-1 text-[var(--muted-foreground)] italic">
                  Original: {noticia.resumoOriginal}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setEditando(true)} variant="outline" size="sm">
              Editar
            </Button>
            {noticia.transcricao && (
              <Button onClick={() => setMostrarTranscricao((v) => !v)} variant="outline" size="sm">
                {mostrarTranscricao ? "Ocultar transcrição" : "Ver transcrição"}
              </Button>
            )}
            {noticia.urlMidia && (
              <a
                href={noticia.urlMidia}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants("outline", "sm")}
              >
                Abrir mídia ↗
              </a>
            )}
          </div>

          {mostrarTranscricao && noticia.transcricao && (
            <p className="whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--muted)] p-2 text-xs text-[var(--muted-foreground)]">
              {noticia.transcricao}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function EditForm({
  noticia,
  rotuloClassificacao,
  onDone,
}: {
  noticia: NoticiaVM;
  rotuloClassificacao: "secretaria" | "tema";
  onDone: () => void;
}) {
  const { formAction, pending, errorMessage } = useAction(salvarRevisaoAction, {
    onSuccess: () => {
      toast.success("Revisão salva.");
      onDone();
    },
  });

  return (
    <form action={formAction} className="mt-2 space-y-2">
      <input type="hidden" name="id" value={noticia.id} />

      <Textarea name="resumo" defaultValue={noticia.resumo ?? ""} rows={3} />

      <div className="flex gap-2">
        <Select name="sentimentoFinal" defaultValue={noticia.sentimentoFinal ?? "Neutro"} className="w-32">
          {SENTIMENTOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <Input
          name="secretaria"
          defaultValue={noticia.secretaria ?? "Outro"}
          placeholder={rotuloClassificacao === "secretaria" ? "Secretaria" : "Tema"}
          aria-label={rotuloClassificacao}
          className="flex-1"
        />
      </div>

      {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" loading={pending} size="sm">
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" onClick={onDone} variant="ghost" size="sm">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
