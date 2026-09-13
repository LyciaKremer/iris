"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { exportarDiaAction } from "@/server/actions/exportar";

export function ExportPanel({ datas }: { datas: string[] }) {
  const [dataEscolhida, setDataEscolhida] = useState(datas[0] ?? "");
  const [mensagens, setMensagens] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  function gerar() {
    setMensagens(null);
    startTransition(async () => {
      const resultado = await exportarDiaAction(dataEscolhida);
      if (!resultado.ok) {
        toast.error(resultado.message ?? "Falha ao exportar.");
        return;
      }
      setMensagens(resultado.mensagens ?? []);
    });
  }

  function baixar() {
    if (!mensagens) return;
    const blob = new Blob([JSON.stringify(mensagens, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mensagens_${dataEscolhida}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-sm font-medium">Data</label>
          <select
            value={dataEscolhida}
            onChange={(e) => setDataEscolhida(e.target.value)}
            className="mt-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm"
          >
            {datas.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={gerar}
          disabled={pending || !dataEscolhida}
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {pending ? "Gerando…" : "Gerar mensagens"}
        </button>
      </div>

      {mensagens && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">{mensagens.length} mensagem(ns) geradas.</p>
            <button onClick={baixar} className="rounded-md border border-[var(--border)] px-3 py-1 text-xs">
              Baixar JSON
            </button>
          </div>
          <div className="space-y-2">
            {mensagens.map((m, i) => (
              <pre
                key={i}
                className="whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 text-xs"
              >
                {m}
              </pre>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
