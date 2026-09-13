"use client";

import { useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { importarAction } from "@/server/actions/importar";

const hoje = new Date().toISOString().slice(0, 10);

export function ImportForm() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { formAction, pending, state, errorMessage } = useAction(importarAction, {
    onSuccess: () => {
      if (state?.ok && state.message) toast.success(state.message);
      if (textareaRef.current) textareaRef.current.value = "";
    },
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="dataExecucao" className="block text-sm font-medium">
          Data do disparo
        </label>
        <input
          id="dataExecucao"
          name="dataExecucao"
          type="date"
          defaultValue={hoje}
          className="mt-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="jsonTexto" className="block text-sm font-medium">
          Cole o JSON exportado de uma página
        </label>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Mesmo fluxo de antes com o dadosPag: cole a página, importe, cole a próxima — cada
          importação acumula sem duplicar (notícia repetida entre páginas é ignorada automaticamente).
        </p>
        <textarea
          ref={textareaRef}
          id="jsonTexto"
          name="jsonTexto"
          rows={12}
          placeholder='{"result": {"clippingName": "...", "items": [...]}}'
          className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs"
        />
      </div>

      {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {pending ? "Importando…" : "Importar página"}
        </button>
        <Link href="/revisar" className="text-sm underline">
          Já colei tudo — ir para revisão
        </Link>
      </div>
    </form>
  );
}
