"use server";

import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { carregarRegistros, resolverPeriodo } from "@/server/queries/relatorioGeral";
import { calcularPicos, filtrarPicosNoPeriodo } from "@/server/queries/picos";
import {
  gerarRelatorioGraficosDocx,
  gerarRelatorioGeralDocx,
  type DadosCandidatoRelatorio,
} from "@/lib/relatorioGraficosDocx";
import { hojeBR } from "@/lib/dates";

type ResultadoRelatorio = { ok: true; arquivoBase64: string; filename: string } | { ok: false; message: string };

/** Porta de gerar_relatorio() em relatorio_graficos.py — relatório .docx
 * com gráficos de UM candidato. */
export async function gerarRelatorioIndividualAction(
  candidatoId: string,
  dias: number,
  inicioIso?: string,
  fimIso?: string,
): Promise<ResultadoRelatorio> {
  await requireUserId();

  const candidato = await prisma.candidato.findUniqueOrThrow({ where: { id: candidatoId } });
  const { inicio, fim, rotulo, diasHistoricoPicos } = resolverPeriodo(dias, inicioIso, fimIso);

  const registros = await carregarRegistros(candidatoId, inicio, fim);
  if (registros.length === 0) {
    return { ok: false, message: `Nenhum registro encontrado pra '${candidato.nome}' no período (${rotulo}).` };
  }

  const picosTodos = await calcularPicos(candidatoId, diasHistoricoPicos, 4, 2.0, fim);
  const picos = filtrarPicosNoPeriodo(picosTodos, inicio, fim);

  const buffer = await gerarRelatorioGraficosDocx(candidato.nome, rotulo, registros, picos);

  return {
    ok: true,
    arquivoBase64: buffer.toString("base64"),
    filename: `${candidato.slug}_relatorio_${hojeBR()}.docx`,
  };
}

/** Porta de gerar_relatorio_geral() — comparativo entre vários candidatos +
 * uma seção de detalhamento individual por candidato. Candidato sem
 * registro no período é pulado (não falha o relatório inteiro). */
export async function gerarRelatorioComparativoAction(
  candidatoIds: string[],
  dias: number,
  inicioIso?: string,
  fimIso?: string,
): Promise<ResultadoRelatorio> {
  await requireUserId();

  if (candidatoIds.length === 0) return { ok: false, message: "Selecione ao menos um candidato." };

  const { inicio, fim, rotulo, diasHistoricoPicos } = resolverPeriodo(dias, inicioIso, fimIso);

  const dadosPorCandidato: DadosCandidatoRelatorio[] = [];
  for (const candidatoId of candidatoIds) {
    const candidato = await prisma.candidato.findUniqueOrThrow({ where: { id: candidatoId } });
    const registros = await carregarRegistros(candidatoId, inicio, fim);
    if (registros.length === 0) continue;

    const picosTodos = await calcularPicos(candidatoId, diasHistoricoPicos, 4, 2.0, fim);
    const picos = filtrarPicosNoPeriodo(picosTodos, inicio, fim);
    dadosPorCandidato.push({ nome: candidato.nome, registros, picos });
  }

  if (dadosPorCandidato.length === 0) {
    return { ok: false, message: `Nenhum candidato com registros no período (${rotulo}).` };
  }

  const buffer = await gerarRelatorioGeralDocx(rotulo, dadosPorCandidato);

  return {
    ok: true,
    arquivoBase64: buffer.toString("base64"),
    filename: `geral_relatorio_${hojeBR()}.docx`,
  };
}
