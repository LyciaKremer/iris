"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { calcularSemanaUtil } from "@/lib/semana";
import { formatarDataBR } from "@/lib/dates";
import { calcularRelatorioAction, baixarRelatorioAction } from "@/server/actions/relatorio";
import type { RelatorioSemanal, RankingItem } from "@/lib/relatorioSemanal";
import { RainbowLoader } from "@/components/rainbow-loader";

const hoje = new Date().toISOString().slice(0, 10);

export function RelatorioPanel() {
  const [dataReferencia, setDataReferencia] = useState(hoje);
  const [relatorio, setRelatorio] = useState<RelatorioSemanal | null>(null);
  const [pending, startTransition] = useTransition();
  const [baixando, setBaixando] = useState<"docx" | "pdf" | null>(null);

  const periodo = calcularSemanaUtil(dataReferencia);

  useEffect(() => {
    startTransition(async () => {
      const resultado = await calcularRelatorioAction(periodo.inicio, periodo.fim);
      if (!resultado.ok) {
        toast.error(resultado.message);
        setRelatorio(null);
        return;
      }
      setRelatorio(resultado.relatorio);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo.inicio, periodo.fim]);

  async function baixar(formato: "docx" | "pdf") {
    setBaixando(formato);
    const resultado = await baixarRelatorioAction(periodo.inicio, periodo.fim, formato);
    setBaixando(null);
    if (!resultado.ok) {
      toast.error(resultado.message);
      return;
    }
    const bytes = Uint8Array.from(atob(resultado.arquivoBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: resultado.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resultado.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium">Qualquer dia da semana desejada</label>
        <input
          type="date"
          value={dataReferencia}
          onChange={(e) => setDataReferencia(e.target.value)}
          className="mt-1 h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm"
        />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Semana: {formatarDataBR(periodo.inicio)} a {formatarDataBR(periodo.fim)}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => baixar("docx")}
          disabled={baixando !== null || !relatorio}
          className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {baixando === "docx" && <RainbowLoader size={14} />}
          {baixando === "docx" ? "Gerando…" : "Baixar .docx"}
        </button>
        <button
          onClick={() => baixar("pdf")}
          disabled={baixando !== null || !relatorio}
          className="flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {baixando === "pdf" && <RainbowLoader size={14} />}
          {baixando === "pdf" ? "Gerando…" : "Baixar PDF"}
        </button>
      </div>

      {pending && (
        <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <RainbowLoader size={14} /> Calculando…
        </p>
      )}

      {relatorio && !pending && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            {relatorio.totalNoticias} notícia(s) relevante(s) de Rádio/TV no período.
          </p>

          <Secao titulo="1. Veículos com mais cobertura — Rádio">
            <Ranking itens={relatorio.veiculosPorTipo["Rádio"] ?? []} rotulo="notícias" />
          </Secao>
          <Secao titulo="Veículos com mais cobertura — Televisão">
            <Ranking itens={relatorio.veiculosPorTipo["Televisão"] ?? []} rotulo="notícias" />
          </Secao>
          <Secao titulo="2. Veículos com mais sinalizações negativas">
            <Ranking itens={relatorio.veiculosNegativos} rotulo="negativas" />
          </Secao>
          <Secao titulo="3. Secretarias/assuntos com mais pontos negativos">
            <Ranking itens={relatorio.secretariasNegativas} rotulo="negativas" />
          </Secao>
          <Secao titulo="4. Pontos positivos mais relevantes">
            <Ranking itens={relatorio.secretariasPositivas} rotulo="positivas" />
          </Secao>
          <Secao titulo="5. Percentual de menções por secretaria/assunto">
            {relatorio.percentualPorSecretaria.length === 0 ? (
              <p className="text-sm italic text-[var(--muted-foreground)]">Nenhum registro no período.</p>
            ) : (
              <div className="space-y-1">
                {relatorio.percentualPorSecretaria.map((item) => (
                  <div key={item.nome} className="flex justify-between text-sm">
                    <span>{item.nome}</span>
                    <span className="text-[var(--muted-foreground)]">
                      {item.quantidade} · {item.percentual}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Secao>
        </div>
      )}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--border)] p-4">
      <h2 className="mb-3 text-sm font-semibold">{titulo}</h2>
      {children}
    </div>
  );
}

function Ranking({ itens, rotulo }: { itens: RankingItem[]; rotulo: string }) {
  if (itens.length === 0) {
    return <p className="text-sm italic text-[var(--muted-foreground)]">Nenhum registro no período.</p>;
  }
  return (
    <div className="space-y-1">
      {itens.map((item) => (
        <div key={item.nome} className="flex justify-between text-sm">
          <span>{item.nome}</span>
          <span className="text-[var(--muted-foreground)]">
            {item.quantidade} {rotulo}
          </span>
        </div>
      ))}
    </div>
  );
}
