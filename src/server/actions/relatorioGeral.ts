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
import { gerarSecoesCandidato, gerarSecoesComparativo, type SecaoGrafico } from "@/lib/relatorioGraficosSvg";
import { hojeBR } from "@/lib/dates";

type ResultadoRelatorio = { ok: true; arquivoBase64: string; filename: string } | { ok: false; message: string };

type ResultadoDados =
  | { ok: true; rotulo: string; dadosPorCandidato: DadosCandidatoRelatorio[] }
  | { ok: false; message: string };

/** Busca registros + picos de cada candidato selecionado, no período
 * resolvido — compartilhado entre a geração do .docx e a dos gráficos em
 * tela, pra não duplicar a sequência de queries nas duas ações. Candidato
 * sem registro no período é pulado (não falha o relatório inteiro). */
async function carregarDadosCandidatos(
  candidatoIds: string[],
  dias: number,
  inicioIso?: string,
  fimIso?: string,
): Promise<ResultadoDados> {
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

  return { ok: true, rotulo, dadosPorCandidato };
}

/** Porta de gerar_relatorio() em relatorio_graficos.py — relatório .docx em
 * tabela (mesmos valores do alertas-wpp) de UM candidato. */
export async function gerarRelatorioIndividualAction(
  candidatoId: string,
  dias: number,
  inicioIso?: string,
  fimIso?: string,
): Promise<ResultadoRelatorio> {
  await requireUserId();

  const dados = await carregarDadosCandidatos([candidatoId], dias, inicioIso, fimIso);
  if (!dados.ok) return dados;

  const { nome, registros, picos } = dados.dadosPorCandidato[0];
  const buffer = await gerarRelatorioGraficosDocx(nome, dados.rotulo, registros, picos);

  const candidato = await prisma.candidato.findUniqueOrThrow({ where: { id: candidatoId } });
  return { ok: true, arquivoBase64: buffer.toString("base64"), filename: `${candidato.slug}_relatorio_${hojeBR()}.docx` };
}

/** Porta de gerar_relatorio_geral() — comparativo entre vários candidatos +
 * uma seção de detalhamento individual por candidato, em tabela. */
export async function gerarRelatorioComparativoAction(
  candidatoIds: string[],
  dias: number,
  inicioIso?: string,
  fimIso?: string,
): Promise<ResultadoRelatorio> {
  await requireUserId();

  if (candidatoIds.length === 0) return { ok: false, message: "Selecione ao menos um candidato." };

  const dados = await carregarDadosCandidatos(candidatoIds, dias, inicioIso, fimIso);
  if (!dados.ok) return dados;

  const buffer = await gerarRelatorioGeralDocx(dados.rotulo, dados.dadosPorCandidato);
  return { ok: true, arquivoBase64: buffer.toString("base64"), filename: `geral_relatorio_${hojeBR()}.docx` };
}

export type ResultadoGraficos =
  | { ok: true; comparativo: SecaoGrafico[]; porCandidato: { nome: string; secoes: SecaoGrafico[] }[] }
  | { ok: false; message: string };

/** Mesmos dados do relatório, mas devolvidos como SVG pra exibir direto na
 * tela — sem passar por rasterização/PNG, então sem o risco de
 * compatibilidade que a versão em .docx com gráfico teve. */
export async function gerarGraficosAction(
  candidatoIds: string[],
  dias: number,
  inicioIso?: string,
  fimIso?: string,
): Promise<ResultadoGraficos> {
  await requireUserId();

  if (candidatoIds.length === 0) return { ok: false, message: "Selecione ao menos um candidato." };

  const dados = await carregarDadosCandidatos(candidatoIds, dias, inicioIso, fimIso);
  if (!dados.ok) return dados;

  const comparativo = dados.dadosPorCandidato.length > 1 ? gerarSecoesComparativo(dados.dadosPorCandidato) : [];
  const porCandidato = dados.dadosPorCandidato.map((d) => ({
    nome: d.nome,
    secoes: gerarSecoesCandidato(d.registros, d.picos),
  }));

  return { ok: true, comparativo, porCandidato };
}
