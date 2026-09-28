"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { atualizarCandidatoAction, alternarAtivoCandidatoAction } from "@/server/actions/candidatos";
import { RainbowLoader } from "@/components/rainbow-loader";

export type CandidatoVM = {
  id: string;
  slug: string;
  nome: string;
  tipo: string;
  clippingMonitoringId: string | null;
  ativo: boolean;
};

export function CandidatoRow({ candidato }: { candidato: CandidatoVM }) {
  const [editando, setEditando] = useState(false);
  const [pending, startTransition] = useTransition();

  function alternarAtivo() {
    startTransition(async () => {
      const resultado = await alternarAtivoCandidatoAction(candidato.id, !candidato.ativo);
      if (!resultado.ok) toast.error(resultado.message ?? "Falha ao atualizar.");
    });
  }

  if (editando) {
    return <EditForm candidato={candidato} onDone={() => setEditando(false)} />;
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--border)] p-3">
      <div>
        <p className="text-sm font-medium">
          {candidato.nome} <span className="text-xs text-[var(--muted-foreground)]">/{candidato.slug}</span>
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {candidato.tipo === "instituicao" ? "Instituição" : "Pessoa"}
          {!candidato.ativo && " · arquivado"}
        </p>
      </div>
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => setEditando(true)}
          className="rounded-md border border-[var(--border)] px-2.5 py-1 font-medium hover:bg-[var(--muted)]"
        >
          Editar
        </button>
        <button
          onClick={alternarAtivo}
          disabled={pending}
          className="rounded-md border border-[var(--border)] px-2.5 py-1 font-medium hover:bg-[var(--muted)] disabled:opacity-60"
        >
          {pending && <RainbowLoader size={12} />}
          {candidato.ativo ? "Arquivar" : "Reativar"}
        </button>
      </div>
    </div>
  );
}

function EditForm({ candidato, onDone }: { candidato: CandidatoVM; onDone: () => void }) {
  const { formAction, pending, errorMessage } = useAction(atualizarCandidatoAction, {
    onSuccess: () => {
      toast.success("Candidato atualizado.");
      onDone();
    },
  });

  return (
    <form action={formAction} className="space-y-2 rounded-md border border-[var(--border)] p-3">
      <input type="hidden" name="id" value={candidato.id} />
      <div className="flex gap-2">
        <input
          name="nome"
          defaultValue={candidato.nome}
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm"
        />
        <input
          name="clippingMonitoringId"
          defaultValue={candidato.clippingMonitoringId ?? ""}
          placeholder="Clipping monitoring id"
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm"
        />
      </div>

      {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-3 py-1 text-xs font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {pending && <RainbowLoader size={12} />}
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onDone} className="text-xs underline">
          Cancelar
        </button>
      </div>
    </form>
  );
}
