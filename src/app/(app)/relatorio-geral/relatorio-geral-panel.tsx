"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FileText, BarChart3 } from "lucide-react";
import {
  gerarRelatorioIndividualAction,
  gerarRelatorioComparativoAction,
  gerarGraficosAction,
} from "@/server/actions/relatorioGeral";
import { GraficoRenderer } from "@/components/charts/GraficoRenderer";
import type { SecaoGrafico } from "@/lib/relatorioGraficosDados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CandidatoOpcao = { id: string; nome: string };
type GraficosOk = { comparativo: SecaoGrafico[]; porCandidato: { nome: string; secoes: SecaoGrafico[] }[] };

export function RelatorioGeralPanel({ candidatos }: { candidatos: CandidatoOpcao[] }) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [dias, setDias] = useState(30);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [pending, startTransition] = useTransition();
  const [pendingGraficos, startTransitionGraficos] = useTransition();
  const [graficos, setGraficos] = useState<GraficosOk | null>(null);

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function periodoAtual() {
    const usaExato = Boolean(inicio && fim);
    return {
      inicioIso: usaExato ? new Date(inicio).toISOString() : undefined,
      fimIso: usaExato ? new Date(fim).toISOString() : undefined,
    };
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
      const { inicioIso, fimIso } = periodoAtual();
      const resultado =
        ids.length === 1
          ? await gerarRelatorioIndividualAction(ids[0], dias, inicioIso, fimIso)
          : await gerarRelatorioComparativoAction(ids, dias, inicioIso, fimIso);
      await baixar(resultado);
    });
  }

  function verGraficos() {
    setGraficos(null);
    startTransitionGraficos(async () => {
      const ids = [...selecionados];
      if (ids.length === 0) {
        toast.error("Selecione ao menos um candidato.");
        return;
      }
      const { inicioIso, fimIso } = periodoAtual();
      const resultado = await gerarGraficosAction(ids, dias, inicioIso, fimIso);
      if (!resultado.ok) {
        toast.error(resultado.message);
        return;
      }
      setGraficos(resultado);
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
          <Input
            type="number"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            disabled={Boolean(inicio && fim)}
            className="mt-1 w-24"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Ou início exato</label>
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="mt-1 w-auto" />
        </div>
        <div>
          <label className="block text-sm font-medium">Fim exato</label>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="mt-1 w-auto" />
        </div>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        Início/fim exatos (se preenchidos) têm prioridade sobre a janela rolante — o período não
        muda dependendo de que dia você gerar o relatório.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button onClick={gerar} loading={pending} disabled={selecionados.size === 0}>
          <FileText className="h-4 w-4" />{" "}
          {pending ? "Gerando…" : `Gerar relatório${selecionados.size > 1 ? " comparativo" : ""} (.docx)`}
        </Button>
        <Button onClick={verGraficos} loading={pendingGraficos} disabled={selecionados.size === 0} variant="outline">
          <BarChart3 className="h-4 w-4" /> {pendingGraficos ? "Calculando…" : "Ver gráficos"}
        </Button>
      </div>

      {graficos && (
        <div className="space-y-6 pt-2">
          {graficos.comparativo.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Visão comparativa</h2>
              {graficos.comparativo.map((secao) => (
                <Grafico key={secao.titulo} secao={secao} />
              ))}
            </div>
          )}

          {graficos.porCandidato.map((c) => (
            <div key={c.nome} className="space-y-4">
              <h2 className="text-sm font-semibold">{c.nome}</h2>
              {c.secoes.map((secao) => (
                <Grafico key={secao.titulo} secao={secao} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Grafico({ secao }: { secao: SecaoGrafico }) {
  return (
    <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="text-sm font-semibold">{secao.titulo}</h3>
      <GraficoRenderer grafico={secao.grafico} />
    </div>
  );
}
