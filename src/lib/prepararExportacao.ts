import "server-only";
import { prisma } from "@/lib/prisma";
import type { Candidato, Noticia } from "@/generated/prisma/client";
import { calcularPeriodo, TIPO_POR_HORARIO_PESSOA, type Horario, type HorarioPessoa } from "@/lib/horarios";
import { unificarNoticias, type NoticiaUnificavel } from "@/lib/unificador";
import { gerarRelatorioTemas } from "@/lib/temasAbordados";

export type PreparoExportacao =
  | {
      ok: true;
      candidato: Candidato;
      noticias: Noticia[];
      noticiasUnificadas: NoticiaUnificavel[];
      relatorio: string | null;
    }
  | { ok: false; message: string };

function filtrarPorBusca(noticias: Noticia[], termo: string): Noticia[] {
  const termoNorm = termo.toLowerCase();
  return noticias.filter((n) =>
    [n.veiculo, n.resumo ?? "", n.transcricao ?? ""].some((campo) => campo.toLowerCase().includes(termoNorm)),
  );
}

/**
 * Núcleo compartilhado entre exportarPorHorarioAction (horários fixos),
 * exportarAvulsoAction (disparo avulso — período/tipo arbitrário + busca
 * livre, porta de disparo_avulso.py/executar.py) e prepararConferenciaAction:
 * busca as notícias do recorte e, só pra candidatos (pessoa), unifica
 * duplicatas e gera o relatório de temas abordados.
 *
 * Unificação (unificador.ts, porta de unificador.py) e relatório de
 * assuntos (temasAbordados.ts, porta de assuntos.py+relatorio.py) são
 * EXCLUSIVOS de candidatos — nunca existiram no fluxo original da PMJP
 * (nem a mensagem "RESUMO DO ALERTAS" faz parte do disparo dela, nem ela
 * une notícias de veículos diferentes sobre o mesmo fato) e continuam sem
 * existir pra ela: instituição usa a lista de notícias exatamente como
 * veio do banco, sem esse passo a mais.
 */
export async function prepararExportacaoPeriodo(
  candidatoId: string,
  inicio: Date,
  fim: Date,
  tiposPermitidos: string[],
  rotuloRelatorio: string,
  busca?: string,
): Promise<PreparoExportacao> {
  const candidato = await prisma.candidato.findUniqueOrThrow({ where: { id: candidatoId } });
  const tipo = candidato.tipo as "pessoa" | "instituicao";

  let noticias = await prisma.noticia.findMany({
    where: {
      candidatoId,
      tipoVeiculo: { in: tiposPermitidos },
      dataPublicacao: { gte: inicio, lte: fim },
    },
  });

  if (busca) {
    noticias = filtrarPorBusca(noticias, busca);
  }

  if (noticias.length === 0) {
    return { ok: false, message: "Nenhuma notícia encontrada nesse período/tipo/busca." };
  }

  const naoProcessadas = noticias.filter((n) => n.resumo === null);
  if (naoProcessadas.length > 0) {
    return {
      ok: false,
      message: `Ainda há ${naoProcessadas.length} notícia(s) não processada(s) nesse recorte — processe em "Revisar" antes de exportar.`,
    };
  }

  if (tipo !== "pessoa") {
    return { ok: true, candidato, noticias, noticiasUnificadas: noticias, relatorio: null };
  }

  const noticiasUnificadas = await unificarNoticias(noticias, candidato.nome);
  const relatorio = await gerarRelatorioTemas(noticiasUnificadas, candidato.nome, rotuloRelatorio);

  return { ok: true, candidato, noticias, noticiasUnificadas, relatorio };
}

/** Atalho pro fluxo dos horários fixos — resolve tipos/período a partir da
 * grade certa (instituição ou pessoa) e delega pro núcleo comum. */
export async function prepararExportacao(
  candidatoId: string,
  data: string,
  horario: Horario,
): Promise<PreparoExportacao> {
  if (!data) return { ok: false, message: "Informe a data." };

  const candidato = await prisma.candidato.findUniqueOrThrow({ where: { id: candidatoId } });
  const tipo = candidato.tipo as "pessoa" | "instituicao";

  const { inicio, fim } = calcularPeriodo(data, horario, tipo);
  const tiposPermitidos =
    tipo === "instituicao" ? ["Rádio", "Televisão"] : [TIPO_POR_HORARIO_PESSOA[horario as HorarioPessoa]];

  return prepararExportacaoPeriodo(candidatoId, inicio, fim, tiposPermitidos, horario);
}
