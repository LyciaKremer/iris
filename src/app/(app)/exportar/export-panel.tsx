"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { exportarPorHorarioAction } from "@/server/actions/exportar";
import { HORARIOS, type Horario } from "@/lib/horarios";
import { RainbowLoader } from "@/components/rainbow-loader";
import { hojeBR } from "@/lib/dates";

export function ExportPanel() {
  const [data, setData] = useState(hojeBR);
  const [horario, setHorario] = useState<Horario>("08h");
  const [mensagens, setMensagens] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  function gerar() {
    setMensagens(null);
    startTransition(async () => {
      const resultado = await exportarPorHorarioAction(data, horario);
      if (!resultado.ok) {
        toast.error(resultado.message ?? "Falha ao exportar.");
        return;
      }
      setMensagens(resultado.mensagens ?? []);
    });
  }

  const nomeArquivo = `mensagens_${data}_${horario}.json`;
  const comando = `python disparar_mensagens.py ${nomeArquivo}`;

  function baixar() {
    if (!mensagens) return;
    const blob = new Blob([JSON.stringify(mensagens, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copiarComando() {
    try {
      await navigator.clipboard.writeText(comando);
      toast.success("Comando copiado.");
    } catch {
      toast.error("Não consegui copiar — copie manualmente.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-sm font-medium">Data do disparo</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="mt-1 h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Envio</label>
          <select
            value={horario}
            onChange={(e) => setHorario(e.target.value as Horario)}
            className="mt-1 h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm"
          >
            {HORARIOS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={gerar}
          disabled={pending || !data}
          className="flex h-9 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {pending && <RainbowLoader size={14} />}
          {pending ? "Gerando…" : "Gerar mensagens"}
        </button>
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        08h: madrugada (00h–08h) · 09h30: residual da noite anterior (17h–23h59 do dia anterior) ·
        14h: manhã (08h–14h) · 18h: tarde (14h–18h).
      </p>

      {mensagens && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">{mensagens.length} mensagem(ns) geradas.</p>
            <button onClick={baixar} className="rounded-md border border-[var(--border)] px-3 py-1 text-xs">
              Baixar JSON
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)] p-3">
            <code className="overflow-x-auto whitespace-nowrap text-xs">{comando}</code>
            <button
              onClick={copiarComando}
              className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs"
            >
              Copiar comando
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
