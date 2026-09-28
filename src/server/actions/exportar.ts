"use server";

import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { montarMensagens } from "@/lib/formatador";
import { montarExportVendor } from "@/lib/vendorExport";
import { prepararExportacao, prepararExportacaoPeriodo } from "@/lib/prepararExportacao";
import type { Horario } from "@/lib/horarios";
import type { TipoCandidato } from "@/lib/anthropic";

/**
 * Gera a lista de mensagens no formato final de envio — o mesmo formato
 * que formatador.py produz localmente. O script local
 * (disparar_mensagens.py) só lê esse JSON exportado e dispara; nenhuma
 * lógica de negócio mora mais lá.
 *
 * A busca/unificação/relatório de temas fica em prepararExportacao() —
 * compartilhado com prepararConferenciaAction, já que os dois partem do
 * mesmo recorte de notícias do período.
 */
export async function exportarPorHorarioAction(
  candidatoId: string,
  data: string,
  horario: Horario,
): Promise<{ ok: boolean; mensagens?: string[]; message?: string }> {
  await requireUserId();

  const preparo = await prepararExportacao(candidatoId, data, horario);
  if (!preparo.ok) return preparo;

  const mensagens = montarMensagens(preparo.noticiasUnificadas, preparo.candidato.tipo as TipoCandidato);
  if (preparo.relatorio) mensagens.push(preparo.relatorio);

  return { ok: true, mensagens };
}

/**
 * Disparo avulso — porta de disparo_avulso.py: período/tipo arbitrário
 * (fora dos horários fixos) + filtro de busca livre opcional. `inicio`/
 * `fim` são datetimes completos (não só a data), e `tipos` é a lista de
 * tipos de veículo escolhida manualmente na tela, sem depender da grade
 * de horário do candidato.
 */
export async function exportarAvulsoAction(
  candidatoId: string,
  inicioIso: string,
  fimIso: string,
  tipos: string[],
  busca?: string,
): Promise<{ ok: boolean; mensagens?: string[]; message?: string }> {
  await requireUserId();

  if (!inicioIso || !fimIso) return { ok: false, message: "Informe o período (início e fim)." };
  if (tipos.length === 0) return { ok: false, message: "Selecione ao menos um tipo de veículo." };

  const inicio = new Date(inicioIso);
  const fim = new Date(fimIso);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return { ok: false, message: "Data/hora inválida." };
  }
  if (inicio > fim) return { ok: false, message: "O início precisa ser antes do fim." };

  const preparo = await prepararExportacaoPeriodo(candidatoId, inicio, fim, tipos, "avulso", busca);
  if (!preparo.ok) return preparo;

  const mensagens = montarMensagens(preparo.noticiasUnificadas, preparo.candidato.tipo as TipoCandidato);
  if (preparo.relatorio) mensagens.push(preparo.relatorio);

  return { ok: true, mensagens };
}

/**
 * Exporta TODA a base acumulada no Iris (não só um dia) no formato que
 * clipping.py/mergeJson.py esperam em dados/prefeitura.json — pensado
 * pra ser jogado direto nessa pasta local e mesclado com
 * `python mergeJson.py prefeitura`. Deliberadamente não filtra por data:
 * mergeJson.py sempre parte do dados/prefeitura.json existente como base,
 * então exportar só um dia arriscaria apagar notícias de outros dias que
 * só existem localmente.
 */
export async function exportarBaseCompletaAction(
  candidatoId: string,
): Promise<{ ok: true; json: string; filename: string } | { ok: false; message: string }> {
  await requireUserId();

  const candidato = await prisma.candidato.findUniqueOrThrow({ where: { id: candidatoId } });

  const noticias = await prisma.noticia.findMany({
    where: { candidatoId },
    distinct: ["noticiaId"],
    select: {
      noticiaId: true,
      veiculo: true,
      tipoVeiculo: true,
      tituloOriginal: true,
      transcricao: true,
      urlMidia: true,
      sentimentoOriginal: true,
      dataPublicacao: true,
    },
    orderBy: { dataPublicacao: "desc" },
  });

  if (noticias.length === 0) {
    return { ok: false, message: "Nenhuma notícia importada ainda." };
  }

  const vendor = montarExportVendor(noticias, candidato.nome);
  return { ok: true, json: JSON.stringify(vendor, null, 4), filename: `${candidato.slug}.json` };
}
