"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { exportarBaseCompletaAction } from "@/server/actions/exportar";
import { Button } from "@/components/ui/button";

export function ExportarBaseCompleta({
  candidatoId,
  candidatoSlug,
}: {
  candidatoId: string;
  candidatoSlug: string;
}) {
  const [pending, startTransition] = useTransition();

  function baixar() {
    startTransition(async () => {
      const resultado = await exportarBaseCompletaAction(candidatoId);
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
    <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="text-sm font-semibold">Base completa pro pipeline local</h2>
      <p className="text-sm text-[var(--muted-foreground)]">
        Baixa TODAS as notícias já importadas no Iris (não só a data selecionada acima) no
        formato de <code>dados/{candidatoSlug}.json</code> — jogue direto nessa pasta e rode{" "}
        <code>python mergeJson.py {candidatoSlug}</code> pra continuar usando o download de mídia
        (<code>baixar_midias.py</code>) local normalmente.
      </p>
      <Button onClick={baixar} loading={pending} variant="outline">
        <Download className="h-4 w-4" /> {pending ? "Gerando…" : `Baixar ${candidatoSlug}.json`}
      </Button>
    </div>
  );
}
