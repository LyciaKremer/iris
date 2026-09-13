"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { processarItemAction } from "@/server/actions/processar";
import { salvarRevisaoAction } from "@/server/actions/revisar";

export type NoticiaVM = {
  id: string;
  veiculo: string;
  tipoVeiculo: string;
  tituloOriginal: string;
  sentimentoOriginal: string;
  resumo: string | null;
  relevante: boolean | null;
  sentimentoFinal: string | null;
  secretaria: string | null;
  revisadoManualmente: boolean;
};

const SENTIMENTOS = ["Positivo", "Negativo", "Neutro"];

export function NoticiaRow({ noticia }: { noticia: NoticiaVM }) {
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);

  const processado = noticia.resumo !== null;

  function processar() {
    startTransition(async () => {
      const resultado = await processarItemAction(noticia.id);
      if (!resultado.ok) toast.error(resultado.message ?? "Falha ao processar.");
    });
  }

  return (
    <div className="rounded-md border border-[var(--border)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm">
          <span className="font-medium">{noticia.veiculo}</span>{" "}
          <span className="text-[var(--muted-foreground)]">· {noticia.tipoVeiculo}</span>
        </div>
        {!processado && (
          <button
            onClick={processar}
            disabled={pending}
            className="shrink-0 rounded-md bg-[var(--primary)] px-3 py-1 text-xs font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {pending ? "Processando…" : "Processar"}
          </button>
        )}
      </div>

      {!processado ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)] italic">Ainda não processado.</p>
      ) : editando ? (
        <EditForm noticia={noticia} onDone={() => setEditando(false)} />
      ) : (
        <div className="mt-2 space-y-1 text-sm">
          {noticia.relevante === false ? (
            <p className="text-[var(--muted-foreground)] italic">Sem informação relevante.</p>
          ) : (
            <p>{noticia.resumo}</p>
          )}
          <p className="text-xs text-[var(--muted-foreground)]">
            Sentimento: {noticia.sentimentoFinal} · Secretaria: {noticia.secretaria}
            {noticia.revisadoManualmente && " · revisado manualmente"}
          </p>
          <button onClick={() => setEditando(true)} className="text-xs underline">
            Editar
          </button>
        </div>
      )}
    </div>
  );
}

function EditForm({ noticia, onDone }: { noticia: NoticiaVM; onDone: () => void }) {
  const { formAction, pending, errorMessage } = useAction(salvarRevisaoAction, {
    onSuccess: () => {
      toast.success("Revisão salva.");
      onDone();
    },
  });

  return (
    <form action={formAction} className="mt-2 space-y-2">
      <input type="hidden" name="id" value={noticia.id} />

      <textarea
        name="resumo"
        defaultValue={noticia.resumo ?? ""}
        rows={3}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm"
      />

      <div className="flex gap-2">
        <select
          name="sentimentoFinal"
          defaultValue={noticia.sentimentoFinal ?? "Neutro"}
          className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm"
        >
          {SENTIMENTOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          name="secretaria"
          defaultValue={noticia.secretaria ?? "Outro"}
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm"
        />
      </div>

      {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--primary)] px-3 py-1 text-xs font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onDone} className="text-xs underline">
          Cancelar
        </button>
      </div>
    </form>
  );
}
