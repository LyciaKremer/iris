"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAction } from "@/hooks/use-action";
import { criarCandidatoAction } from "@/server/actions/candidatos";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

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
      <Button onClick={() => setAberto(true)}>+ Novo candidato</Button>

      {aberto && (
        <Modal titulo="Novo candidato" onClose={() => setAberto(false)}>
          <form ref={formRef} action={formAction} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Nome</label>
                <Input name="nome" placeholder="Ex: Veneziano Vital do Rêgo" className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Slug (vira a URL)</label>
                <Input name="slug" placeholder="Ex: veneziano" className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Tipo</label>
                <Select name="tipo" defaultValue="pessoa" className="mt-1">
                  <option value="pessoa">Pessoa (candidato)</option>
                  <option value="instituicao">Instituição</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium">Clipping monitoring id (opcional)</label>
                <Input name="clippingMonitoringId" placeholder="Id do vendor de clipping" className="mt-1" />
              </div>
            </div>

            {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={pending}>
                {pending ? "Criando…" : "Criar candidato"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
