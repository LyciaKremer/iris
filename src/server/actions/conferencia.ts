"use server";

import { requireUserId } from "@/lib/dal";
import { prepararExportacao } from "@/lib/prepararExportacao";
import { montarMensagensPorSentimento } from "@/lib/formatador";
import { formatarDataISO } from "@/lib/dates";
import type { Horario } from "@/lib/horarios";

export type RegistroConferencia = {
  data: string;
  id: string;
  veiculo: string;
  tipo: string;
  sentimento: string;
  classificacao: string | null;
  relevante: boolean | null;
  resumo: string | null;
  transcricao: string | null;
  revisadoPelaIa: boolean;
  resumoOriginal: string | null;
  problemaDetectado: string | null;
};

export type ConferenciaResultado = {
  ok: true;
  candidatoSlug: string;
  negativos: string;
  neutros: string;
  positivos: string;
  resumo: string;
  historico: RegistroConferencia[];
};

/**
 * Porta de conferencia.py (alertas-wpp) — mesmo conteúdo (mensagens
 * enviadas por sentimento + o relatório de temas abordados + o recorte do
 * histórico só desse disparo), mas sem gravar pasta no servidor (Vercel
 * não tem disco persistente): devolve os dados pro cliente montar um .zip
 * e baixar, replicando `<data>/<candidato>/<horario>/` como estrutura de
 * pastas dentro do zip.
 *
 * O histórico usa as notícias PRÉ-unificação (preparo.noticias) — itens
 * fundidos pelo unificador perdem a correspondência 1:1 com a transcrição
 * original de cada veículo, que é justamente o que serve pra conferir.
 */
export async function prepararConferenciaAction(
  candidatoId: string,
  data: string,
  horario: Horario,
): Promise<ConferenciaResultado | { ok: false; message: string }> {
  await requireUserId();

  const preparo = await prepararExportacao(candidatoId, data, horario);
  if (!preparo.ok) return preparo;

  const porSentimento = montarMensagensPorSentimento(preparo.noticiasUnificadas);

  const historico: RegistroConferencia[] = preparo.noticias.map((n) => ({
    data: formatarDataISO(n.dataPublicacao),
    id: n.id,
    veiculo: n.veiculo,
    tipo: n.tipoVeiculo,
    sentimento: n.sentimentoFinal ?? n.sentimentoOriginal,
    classificacao: n.secretaria,
    relevante: n.relevante,
    resumo: n.resumo,
    transcricao: n.transcricao,
    revisadoPelaIa: n.revisadoPelaIa,
    resumoOriginal: n.resumoOriginal,
    problemaDetectado: n.problemaDetectado,
  }));

  return {
    ok: true,
    candidatoSlug: preparo.candidato.slug,
    negativos: porSentimento.Negativo.join("\n\n"),
    neutros: porSentimento.Neutro.join("\n\n"),
    positivos: porSentimento.Positivo.join("\n\n"),
    resumo: preparo.relatorio ?? "",
    historico,
  };
}
