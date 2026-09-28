"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { processarItemAction } from "@/server/actions/processar";
import { RainbowLoader } from "@/components/rainbow-loader";

export function ProcessarTodas({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null);
  const [pending, startTransition] = useTransition();

  if (ids.length === 0) return null;

  function processarTodas() {
    startTransition(async () => {
      let falhas = 0;
      for (let i = 0; i < ids.length; i++) {
        setProgresso({ atual: i + 1, total: ids.length });
        const resultado = await processarItemAction(ids[i]);
        if (!resultado.ok) {
          falhas++;
          toast.error(resultado.message ?? `Falha ao processar ${ids[i]}.`);
        }
      }
      setProgresso(null);
      router.refresh();
      if (falhas === 0) {
        toast.success("Todas as notícias pendentes foram processadas.");
      } else {
        toast.warning(`${ids.length - falhas} processada(s), ${falhas} com falha.`);
      }
    });
  }

  return (
    <button
      onClick={processarTodas}
      disabled={pending}
      className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
    >
      {progresso && <RainbowLoader size={14} />}
      {progresso ? `Processando ${progresso.atual}/${progresso.total}…` : `Processar todas (${ids.length})`}
    </button>
  );
}
