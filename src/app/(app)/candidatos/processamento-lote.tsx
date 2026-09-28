"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { listarIdsPendentesAction, processarItemAction } from "@/server/actions/processar";
import { RainbowLoader } from "@/components/rainbow-loader";
import { hojeBR } from "@/lib/dates";

type CandidatoOpcao = { id: string; slug: string; nome: string };
type ResultadoPorCandidato = { nome: string; processadas: number; falhas: number };

/**
 * Porta do loop de main.py (processar vários/todos os candidatos de uma
 * vez) — um candidato de cada vez, item a item, seguindo pro próximo
 * mesmo se um candidato ou um item falhar (mesma resiliência do
 * `for candidato_slug in candidatos_slugs: try: ... except: ...continue`).
 */
export function ProcessamentoLote({ candidatos }: { candidatos: CandidatoOpcao[] }) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [dataExecucao, setDataExecucao] = useState(hojeBR);
  const [progresso, setProgresso] = useState<{ candidato: string; atual: number; total: number } | null>(null);
  const [resultados, setResultados] = useState<ResultadoPorCandidato[] | null>(null);
  const [pending, startTransition] = useTransition();

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function processar() {
    setResultados(null);
    startTransition(async () => {
      const alvo = candidatos.filter((c) => selecionados.has(c.id));
      const resumoFinal: ResultadoPorCandidato[] = [];

      for (const candidato of alvo) {
        let ids: string[];
        try {
          ids = await listarIdsPendentesAction(candidato.id, dataExecucao);
        } catch (erro) {
          toast.error(`Falha ao buscar pendentes de '${candidato.nome}': ${String(erro)}`);
          resumoFinal.push({ nome: candidato.nome, processadas: 0, falhas: 0 });
          continue;
        }

        let falhas = 0;
        for (let i = 0; i < ids.length; i++) {
          setProgresso({ candidato: candidato.nome, atual: i + 1, total: ids.length });
          try {
            const resultado = await processarItemAction(ids[i]);
            if (!resultado.ok) falhas++;
          } catch {
            falhas++;
          }
        }
        resumoFinal.push({ nome: candidato.nome, processadas: ids.length - falhas, falhas });
      }

      setProgresso(null);
      setResultados(resumoFinal);
    });
  }

  if (candidatos.length === 0) return null;

  return (
    <div className="space-y-3 rounded-md border border-[var(--border)] p-4">
      <h2 className="text-sm font-semibold">Processar em lote</h2>
      <p className="text-xs text-[var(--muted-foreground)]">
        Processa as notícias pendentes de vários candidatos de uma vez, pra data de importação
        escolhida — útil pra rodar o mesmo horário (ex: 9h) pra vários candidatos seguidos.
      </p>

      <div>
        <label className="block text-sm font-medium">Data de importação</label>
        <input
          type="date"
          value={dataExecucao}
          onChange={(e) => setDataExecucao(e.target.value)}
          className="mt-1 h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        {candidatos.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selecionados.has(c.id)}
              onChange={() => alternar(c.id)}
            />
            {c.nome}
          </label>
        ))}
      </div>

      <button
        onClick={processar}
        disabled={pending || selecionados.size === 0}
        className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
      >
        {pending && <RainbowLoader size={14} />}
        {pending ? "Processando…" : `Processar selecionados (${selecionados.size})`}
      </button>

      {progresso && (
        <p className="text-xs text-[var(--muted-foreground)]">
          {progresso.candidato}: {progresso.atual}/{progresso.total}…
        </p>
      )}

      {resultados && (
        <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
          {resultados.map((r) => (
            <p key={r.nome}>
              {r.nome}: {r.processadas} processada(s){r.falhas > 0 && `, ${r.falhas} falha(s)`}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
