"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { importarAction } from "@/server/actions/importar";

const hoje = new Date().toISOString().slice(0, 10);

export function ImportForm() {
  const router = useRouter();
  const { formAction, pending, state, errorMessage } = useAction(importarAction, {
    onSuccess: () => {
      if (state?.ok && state.message) toast.success(state.message);
      router.push("/revisar");
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
        <label htmlFor="arquivo" className="block text-sm font-medium">
          Arquivo JSON exportado (mesmo formato do mergeJson.py)
        </label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          accept="application/json"
          className="mt-1 block w-full text-sm"
        />
      </div>

      {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
      >
        {pending ? "Importando…" : "Importar"}
      </button>
    </form>
  );
}
