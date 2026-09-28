"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { criarCandidatoAction } from "@/server/actions/candidatos";
import { RainbowLoader } from "@/components/rainbow-loader";
import { Modal } from "@/components/modal";

export function NovoCandidatoForm() {
  const [aberto, setAberto] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { formAction, pending, state, errorMessage } = useAction(criarCandidatoAction, {
    onSuccess: () => {
      if (state?.ok && state.message) toast.success(state.message);
      formRef.current?.reset();
      setAberto(false);
    },
  });

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
      >
        + Novo candidato
      </button>

      {aberto && (
        <Modal titulo="Novo candidato" onClose={() => setAberto(false)}>
          <form ref={formRef} action={formAction} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Nome</label>
                <input
                  name="nome"
                  placeholder="Ex: Veneziano Vital do Rêgo"
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Slug (vira a URL)</label>
                <input
                  name="slug"
                  placeholder="Ex: veneziano"
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Tipo</label>
                <select
                  name="tipo"
                  defaultValue="pessoa"
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
                >
                  <option value="pessoa">Pessoa (candidato)</option>
                  <option value="instituicao">Instituição</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Clipping monitoring id (opcional)</label>
                <input
                  name="clippingMonitoringId"
                  placeholder="Id do vendor de clipping"
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
                />
              </div>
            </div>

            {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
              >
                {pending && <RainbowLoader size={14} />}
                {pending ? "Criando…" : "Criar candidato"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
