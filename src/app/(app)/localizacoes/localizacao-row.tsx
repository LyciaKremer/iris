"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { removerLocalizacaoAction } from "@/server/actions/localizacoes";
import { RainbowLoader } from "@/components/rainbow-loader";

export type LocalizacaoVM = { veiculo: string; cidade: string; regiao: string; tipoFonte: string | null };

export function LocalizacaoRow({ localizacao }: { localizacao: LocalizacaoVM }) {
  const [pending, startTransition] = useTransition();

  function remover() {
    startTransition(async () => {
      const resultado = await removerLocalizacaoAction(localizacao.veiculo);
      if (!resultado.ok) toast.error(resultado.message ?? "Falha ao remover.");
    });
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--border)] p-3 text-sm">
      <div>
        <p className="font-medium">{localizacao.veiculo}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {localizacao.cidade} · {localizacao.regiao}
          {localizacao.tipoFonte && ` · ${localizacao.tipoFonte}`}
        </p>
      </div>
      <button
        onClick={remover}
        disabled={pending}
        className="flex items-center gap-2 rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--muted)] disabled:opacity-60"
      >
        {pending && <RainbowLoader size={12} />}
        Remover
      </button>
    </div>
  );
}
