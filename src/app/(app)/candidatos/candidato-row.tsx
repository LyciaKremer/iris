"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Archive, ArchiveRestore, Check, X } from "lucide-react";
import { useAction } from "@/hooks/use-action";
import { atualizarCandidatoAction, alternarAtivoCandidatoAction } from "@/server/actions/candidatos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--card)] p-3">
      <div>
        <p className="text-sm font-medium">
          {candidato.nome} <span className="text-xs text-[var(--muted-foreground)]">/{candidato.slug}</span>
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {candidato.tipo === "instituicao" ? "Instituição" : "Pessoa"}
          {!candidato.ativo && " · arquivado"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setEditando(true)} variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
        <Button onClick={alternarAtivo} loading={pending} variant="outline" size="sm">
          {candidato.ativo ? (
            <Archive className="h-3.5 w-3.5" />
          ) : (
            <ArchiveRestore className="h-3.5 w-3.5" />
          )}
          {candidato.ativo ? "Arquivar" : "Reativar"}
        </Button>
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
    <form action={formAction} className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--card)] p-3">
      <input type="hidden" name="id" value={candidato.id} />
      <div className="flex gap-2">
        <Input name="nome" defaultValue={candidato.nome} className="flex-1" />
        <Input
          name="clippingMonitoringId"
          defaultValue={candidato.clippingMonitoringId ?? ""}
          placeholder="Clipping monitoring id"
          className="flex-1"
        />
      </div>

      {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" loading={pending} size="sm">
          <Check className="h-3.5 w-3.5" /> {pending ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" onClick={onDone} variant="ghost" size="sm">
          <X className="h-3.5 w-3.5" /> Cancelar
        </Button>
      </div>
    </form>
  );
}
