"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { calcularPicosAction } from "@/server/actions/picos";
import type { Pico } from "@/server/queries/picos";
import { formatarDataBR } from "@/lib/dates";
import { RainbowLoader } from "@/components/rainbow-loader";

export function PicosPanel({ candidatoId }: { candidatoId: string }) {
  const [dias, setDias] = useState(90);
  const [limiar, setLimiar] = useState(2.0);
  const [picos, setPicos] = useState<Pico[] | null>(null);
  const [pending, startTransition] = useTransition();

  function buscar() {
    startTransition(async () => {
      const resultado = await calcularPicosAction(candidatoId, dias, limiar);
      if (!resultado.ok) {
        toast.error(resultado.message);
        return;
      }
      setPicos(resultado.picos);
    });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => buscar(), []);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-sm font-medium">Dias de histórico</label>
          <input
            type="number"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="mt-1 h-9 w-24 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Limiar (x acima da média)</label>
          <input
            type="number"
            step="0.1"
            value={limiar}
            onChange={(e) => setLimiar(Number(e.target.value))}
            className="mt-1 h-9 w-24 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm"
          />
        </div>
        <button
          onClick={buscar}
          disabled={pending}
          className="flex h-9 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {pending && <RainbowLoader size={14} />}
          {pending ? "Calculando…" : "Recalcular"}
        </button>
      </div>

      {picos && picos.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)]">
          Nenhum pico de volume nos últimos {dias} dias (limiar {limiar}x).
        </p>
      )}

      {picos && picos.length > 0 && (
        <div className="space-y-3">
          {picos.map((pico) => (
            <div key={pico.data} className="rounded-md border border-[var(--border)] p-4 text-sm">
              <p className="font-medium">
                📈 {formatarDataBR(pico.data)} ({pico.diaSemana}) — {pico.volume} notícias
              </p>
              <p className="text-[var(--muted-foreground)]">
                Média de {pico.diaSemana}s anteriores: {pico.mediaBaseline} · {pico.razao}x acima do
                normal
              </p>
              <p className="mt-2">
                <span className="text-[var(--muted-foreground)]">Temas que mais apareceram:</span>{" "}
                {pico.temasPrincipais.map(([t, q]) => `${t} (${q})`).join(", ") || "—"}
              </p>
              <p>
                <span className="text-[var(--muted-foreground)]">Veículos que mais publicaram:</span>{" "}
                {pico.veiculosPrincipais.map(([v, q]) => `${v} (${q})`).join(", ") || "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
