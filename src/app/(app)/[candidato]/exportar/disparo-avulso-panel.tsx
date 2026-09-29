"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { exportarAvulsoAction } from "@/server/actions/exportar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TIPOS_DISPONIVEIS = ["Rádio", "Televisão", "Online"];

/** Porta de disparo_avulso.py — período/tipo arbitrário fora dos horários
 * fixos, com filtro de busca livre opcional. */
export function DisparoAvulsoPanel({ candidatoId }: { candidatoId: string }) {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [tipos, setTipos] = useState<Set<string>>(new Set(["Rádio"]));
  const [busca, setBusca] = useState("");
  const [mensagens, setMensagens] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  function alternarTipo(tipo: string) {
    setTipos((atual) => {
      const novo = new Set(atual);
      if (novo.has(tipo)) novo.delete(tipo);
      else novo.add(tipo);
      return novo;
    });
  }

  function gerar() {
    setMensagens(null);
    startTransition(async () => {
      const resultado = await exportarAvulsoAction(
        candidatoId,
        new Date(inicio).toISOString(),
        new Date(fim).toISOString(),
        [...tipos],
        busca.trim() || undefined,
      );
      if (!resultado.ok) {
        toast.error(resultado.message ?? "Falha ao exportar.");
        return;
      }
      setMensagens(resultado.mensagens ?? []);
    });
  }

  return (
    <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="text-sm font-semibold">Disparo avulso</h2>
      <p className="text-xs text-[var(--muted-foreground)]">
        Período e tipo de veículo arbitrários, fora dos horários fixos acima — útil pra
        investigar um recorte específico ou preencher retroativamente um período que não foi
        exportado na hora certa.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-sm font-medium">Início</label>
          <Input
            type="datetime-local"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="mt-1 w-auto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Fim</label>
          <Input
            type="datetime-local"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="mt-1 w-auto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Busca (opcional)</label>
          <Input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Veículo, título ou transcrição…"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {TIPOS_DISPONIVEIS.map((tipo) => (
          <label key={tipo} className="flex items-center gap-1.5">
            <input type="checkbox" checked={tipos.has(tipo)} onChange={() => alternarTipo(tipo)} />
            {tipo}
          </label>
        ))}
      </div>

      <Button onClick={gerar} loading={pending} disabled={!inicio || !fim}>
        {pending ? "Gerando…" : "Gerar mensagens (avulso)"}
      </Button>

      {mensagens && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--muted-foreground)]">{mensagens.length} mensagem(ns) geradas.</p>
          {mensagens.map((m, i) => (
            <pre
              key={i}
              className="whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 text-xs"
            >
              {m}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}
