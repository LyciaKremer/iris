"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { listarPendentesPorHorarioAction, processarItemAction } from "@/server/actions/processar";
import { TODOS_HORARIOS, horarioValidoPara, type Horario } from "@/lib/horarios";
import { RainbowLoader } from "@/components/rainbow-loader";
import { Modal } from "@/components/modal";
import { hojeBR } from "@/lib/dates";

type CandidatoOpcao = { id: string; slug: string; nome: string; tipo: "pessoa" | "instituicao" };
type ResultadoPorCandidato = { nome: string; processadas: number; falhas: number };
type ItemAtual = { veiculo: string; tipoVeiculo: string } | null;
type Progresso = {
  candidato: string;
  candidatoIndex: number;
  totalCandidatos: number;
  item: ItemAtual;
  atual: number;
  total: number;
};

/**
 * Porta do loop de main.py (processar vários/todos os candidatos de uma
 * vez) — um candidato de cada vez, item a item, seguindo pro próximo mesmo
 * se um candidato ou um item falhar. Diferente da versão anterior: agora
 * pede um HORÁRIO (o mesmo recorte que "Revisar"/"Exportar" usam pra esse
 * candidato) em vez de processar tudo que estiver pendente na data
 * inteira, e mostra ao vivo qual notícia está sendo processada.
 */
export function ProcessamentoLote({ candidatos }: { candidatos: CandidatoOpcao[] }) {
  const [aberto, setAberto] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [data, setData] = useState(hojeBR);
  const [horario, setHorario] = useState<Horario>("14h");
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [resultados, setResultados] = useState<ResultadoPorCandidato[] | null>(null);
  const [pending, startTransition] = useTransition();

  if (candidatos.length === 0) return null;

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
      const alvo = candidatos.filter((c) => selecionados.has(c.id) && horarioValidoPara(horario, c.tipo));
      if (alvo.length === 0) {
        toast.error("Nenhum candidato selecionado é compatível com esse horário.");
        return;
      }

      const resumoFinal: ResultadoPorCandidato[] = [];

      for (let ci = 0; ci < alvo.length; ci++) {
        const candidato = alvo[ci];

        let pendentes: { id: string; veiculo: string; tipoVeiculo: string }[];
        try {
          pendentes = await listarPendentesPorHorarioAction(candidato.id, data, horario);
        } catch (erro) {
          toast.error(`Falha ao buscar pendentes de '${candidato.nome}': ${String(erro)}`);
          resumoFinal.push({ nome: candidato.nome, processadas: 0, falhas: 0 });
          continue;
        }

        let falhas = 0;
        for (let i = 0; i < pendentes.length; i++) {
          setProgresso({
            candidato: candidato.nome,
            candidatoIndex: ci + 1,
            totalCandidatos: alvo.length,
            item: { veiculo: pendentes[i].veiculo, tipoVeiculo: pendentes[i].tipoVeiculo },
            atual: i + 1,
            total: pendentes.length,
          });
          try {
            const resultado = await processarItemAction(pendentes[i].id);
            if (!resultado.ok) falhas++;
          } catch {
            falhas++;
          }
        }
        resumoFinal.push({ nome: candidato.nome, processadas: pendentes.length - falhas, falhas });
      }

      setProgresso(null);
      setResultados(resumoFinal);
    });
  }

  const ignorados = candidatos.filter((c) => selecionados.has(c.id) && !horarioValidoPara(horario, c.tipo));

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
      >
        Processar em lote
      </button>

      {aberto && (
        <Modal titulo="Processar em lote" onClose={() => setAberto(false)} largura="max-w-xl">
          <div className="space-y-4">
            <p className="text-xs text-[var(--muted-foreground)]">
              Processa as notícias pendentes de vários candidatos de uma vez, dentro da janela de UM
              horário — o mesmo recorte que &quot;Exportar&quot; usa pra esse candidato. Útil pra rodar
              o mesmo horário (ex: 9h) pra vários candidatos seguidos.
            </p>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-sm font-medium">Data</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  disabled={pending}
                  className="mt-1 h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Horário</label>
                <select
                  value={horario}
                  onChange={(e) => setHorario(e.target.value as Horario)}
                  disabled={pending}
                  className="mt-1 h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-sm disabled:opacity-60"
                >
                  {TODOS_HORARIOS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Candidatos</p>
              {candidatos.map((c) => {
                const compativel = horarioValidoPara(horario, c.tipo);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 text-sm ${!compativel ? "opacity-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selecionados.has(c.id)}
                      onChange={() => alternar(c.id)}
                      disabled={pending}
                    />
                    {c.nome}
                    {!compativel && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        (sem horário {horario} — é {c.tipo === "instituicao" ? "instituição" : "pessoa"})
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {ignorados.length > 0 && (
              <p className="text-xs text-[var(--muted-foreground)]">
                {ignorados.length} candidato(s) selecionado(s) não roda(m) nesse horário e será(ão)
                ignorado(s).
              </p>
            )}

            <button
              onClick={processar}
              disabled={pending || selecionados.size === 0}
              className="flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
            >
              {pending && <RainbowLoader size={14} />}
              {pending ? "Processando…" : `Processar selecionados (${selecionados.size})`}
            </button>

            {progresso && (
              <div className="space-y-1 rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 text-xs">
                <p className="font-medium">
                  Candidato {progresso.candidatoIndex}/{progresso.totalCandidatos}: {progresso.candidato}
                </p>
                <p className="text-[var(--muted-foreground)]">
                  Notícia {progresso.atual}/{progresso.total}
                  {progresso.item && ` — ${progresso.item.veiculo} (${progresso.item.tipoVeiculo})`}
                </p>
              </div>
            )}

            {resultados && (
              <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
                {resultados.map((r) => (
                  <p key={r.nome}>
                    {r.nome}: {r.processadas} processada(s)
                    {r.falhas > 0 && `, ${r.falhas} falha(s)`}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
