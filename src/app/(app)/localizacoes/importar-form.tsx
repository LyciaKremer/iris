"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { importarLocalizacoesAction } from "@/server/actions/localizacoes";
import { RainbowLoader } from "@/components/rainbow-loader";

export function ImportarLocalizacoesForm() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { formAction, pending, state, errorMessage } = useAction(importarLocalizacoesAction, {
    onSuccess: () => {
      if (state?.ok && state.message) toast.success(state.message);
      if (textareaRef.current) textareaRef.current.value = "";
    },
  });

  return (
    <form action={formAction} className="space-y-3 rounded-md border border-[var(--border)] p-4">
      <div>
        <label htmlFor="texto" className="block text-sm font-medium">
          Cole as linhas da planilha (Veículo;Cidade-sede;Região;Tipo)
        </label>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Uma linha por veículo, campos separados por ponto-e-vírgula ou vírgula. Veículo repetido
          atualiza o registro existente.
        </p>
        <textarea
          ref={textareaRef}
          id="texto"
          name="texto"
          rows={6}
          placeholder={"Rádio Progresso AM 610;Sousa;Sertão;Rádio\nCBN João Pessoa;João Pessoa;Litoral;Rádio"}
          className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs"
        />
      </div>

      {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
      >
        {pending && <RainbowLoader size={14} />}
        {pending ? "Importando…" : "Importar linhas"}
      </button>
    </form>
  );
}
