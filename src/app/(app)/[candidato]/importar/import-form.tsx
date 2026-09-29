"use client";

import { useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Upload, ArrowRight } from "lucide-react";
import { useAction } from "@/hooks/use-action";
import { importarAction } from "@/server/actions/importar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { hojeBR } from "@/lib/dates";

export function ImportForm({ candidatoId, candidatoSlug }: { candidatoId: string; candidatoSlug: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { formAction, pending, state, errorMessage } = useAction(importarAction, {
    onSuccess: () => {
      if (state?.ok && state.message) toast.success(state.message);
      if (textareaRef.current) textareaRef.current.value = "";
    },
  });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="candidatoId" value={candidatoId} />
      <input type="hidden" name="candidatoSlug" value={candidatoSlug} />

      <div>
        <label htmlFor="dataExecucao" className="block text-sm font-medium">
          Data do disparo
        </label>
        <Input id="dataExecucao" name="dataExecucao" type="date" defaultValue={hojeBR()} className="mt-1 w-auto" />
      </div>

      <div>
        <label htmlFor="jsonTexto" className="block text-sm font-medium">
          Cole o JSON exportado de uma página
        </label>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Mesmo fluxo de antes com o dadosPag: cole a página, importe, cole a próxima — cada
          importação acumula sem duplicar (notícia repetida entre páginas é ignorada automaticamente).
        </p>
        <Textarea
          ref={textareaRef}
          id="jsonTexto"
          name="jsonTexto"
          rows={12}
          placeholder='{"result": {"clippingName": "...", "items": [...]}}'
          className="mt-2 font-mono text-xs"
        />
      </div>

      {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

      <div className="flex items-center justify-end gap-3">
        <Link href={`/${candidatoSlug}/revisar`} className={buttonVariants("outline", "md")}>
          Já colei tudo — ir para revisão <ArrowRight className="h-4 w-4" />
        </Link>
        <Button type="submit" loading={pending}>
          <Upload className="h-4 w-4" /> {pending ? "Importando…" : "Importar página"}
        </Button>
      </div>
    </form>
  );
}
