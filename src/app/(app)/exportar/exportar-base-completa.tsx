"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { exportarBaseCompletaAction } from "@/server/actions/exportar";
import { RainbowLoader } from "@/components/rainbow-loader";

export function ExportarBaseCompleta() {
  const [pending, startTransition] = useTransition();

  function baixar() {
    startTransition(async () => {
      const resultado = await exportarBaseCompletaAction();
      if (!resultado.ok) {
        toast.error(resultado.message);
        return;
      }
      const blob = new Blob([resultado.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resultado.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-2 rounded-md border border-[var(--border)] p-4">
      <h2 className="text-sm font-semibold">Base completa pro pipeline local</h2>
      <p className="text-sm text-[var(--muted-foreground)]">
        Baixa TODAS as notícias já importadas no Iris (não só a data selecionada acima) no
        formato de <code>dados/prefeitura.json</code> — jogue direto nessa pasta e rode{" "}
        <code>python mergeJson.py prefeitura</code> pra continuar usando o download de mídia
        (<code>baixar_midias.py</code>) local normalmente.
      </p>
      <button
        onClick={baixar}
        disabled={pending}
        className="flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending && <RainbowLoader size={14} />}
        {pending ? "Gerando…" : "Baixar prefeitura.json"}
      </button>
    </div>
  );
}
