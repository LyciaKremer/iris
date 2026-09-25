"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { itensDoDia } from "@/lib/checklist";
import { obterChecklistAction, alternarItemChecklistAction } from "@/server/actions/checklist";
import { RainbowLoader } from "@/components/rainbow-loader";
import { hojeBR } from "@/lib/dates";

export function ChecklistFlutuante() {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [itens, setItens] = useState<Record<string, boolean>>({});
  const data = hojeBR();
  const lista = itensDoDia(data);

  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    obterChecklistAction(data).then((resultado) => {
      setCarregando(false);
      if (resultado.ok) setItens(resultado.itens);
      else toast.error(resultado.message);
    });
  }, [aberto, data]);

  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  async function alternar(chave: string, concluido: boolean) {
    setItens((atual) => ({ ...atual, [chave]: concluido }));
    const resultado = await alternarItemChecklistAction(data, chave, concluido);
    if (!resultado.ok) {
      toast.error(resultado.message ?? "Falha ao salvar.");
      setItens((atual) => ({ ...atual, [chave]: !concluido }));
    }
  }

  const feitos = lista.filter((item) => itens[item.chave]).length;

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        aria-label="Checklist do dia"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg"
      >
        ✅
        {feitos > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--card)] text-[10px] font-semibold text-[var(--foreground)] ring-1 ring-[var(--border)]">
            {feitos}
          </span>
        )}
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Checklist do dia</h2>
              <button onClick={() => setAberto(false)} aria-label="Fechar" className="text-sm text-[var(--muted-foreground)]">
                ✕
              </button>
            </div>

            {carregando ? (
              <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <RainbowLoader size={14} /> Carregando…
              </p>
            ) : (
              <ul className="space-y-2">
                {lista.map((item) => (
                  <li key={item.chave} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      id={`checklist-${item.chave}`}
                      checked={!!itens[item.chave]}
                      onChange={(e) => alternar(item.chave, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`checklist-${item.chave}`}>{item.label}</label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
