"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { gerarRelatorioIndividualAction, gerarRelatorioComparativoAction } from "@/server/actions/relatorioGeral";
import { RainbowLoader } from "@/components/rainbow-loader";

type CandidatoOpcao = { id: string; nome: string };

export function RelatorioGeralPanel({ candidatos }: { candidatos: CandidatoOpcao[] }) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [dias, setDias] = useState(30);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [pending, startTransition] = useTransition();

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function baixar(resultado: { ok: boolean; arquivoBase64?: string; filename?: string; message?: string }) {
    if (!resultado.ok || !resultado.arquivoBase64 || !resultado.filename) {
      toast.error(resultado.message ?? "Falha ao gerar o relatório.");
      return;
    }
    const bytes = Uint8Array.from(atob(resultado.arquivoBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resultado.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function gerar() {
    startTransition(async () => {
      const ids = [...selecionados];
      if (ids.length === 0) {
        toast.error("Selecione ao menos um candidato.");
        return;
      }

      const usaExato = Boolean(inicio && fim);
      const inicioIso = usaExato ? new Date(inicio).toISOString() : undefined;
      const fimIso = usaExato ? new Date(fim).toISOString() : undefined;

      const resultado =
        ids.length === 1
          ? await gerarRelatorioIndividualAction(ids[0], dias, inicioIso, fimIso)
          : await gerarRelatorioComparativoAction(ids, dias, inicioIso, fimIso);

      await baixar(resultado);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Candidatos</p>
        {candidatos.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selecionados.has(c.id)} onChange={() => alternar(c.id)} />
            {c.nome}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-sm font-medium">Janela rolante (dias)</label>
          <input
            type="number"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            disabled={Boolean(inicio && fim)}
            className="mt-1 h-9 w-24 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Ou início exato</label>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="mt-1 h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Fim exato</label>
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="mt-1 h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        Início/fim exatos (se preenchidos) têm prioridade sobre a janela rolante — o período não
        muda dependendo de que dia você gerar o relatório.
      </p>

      <button
        onClick={gerar}
        disabled={pending || selecionados.size === 0}
        className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
      >
        {pending && <RainbowLoader size={14} />}
        {pending
          ? "Gerando…"
          : `Gerar relatório${selecionados.size > 1 ? " comparativo" : ""} (.docx)`}
      </button>
    </div>
  );
}
