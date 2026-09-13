"use server";

import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { montarMensagens } from "@/lib/formatador";
import { montarExportVendor } from "@/lib/vendorExport";
import { PERSONAGEM } from "@/lib/config";
import { calcularPeriodo, type Horario } from "@/lib/horarios";

/**
 * Gera a lista de mensagens no formato final de envio — o mesmo formato
 * que formatador.py produz localmente. O script local
 * (disparar_mensagens.py) só lê esse JSON exportado e dispara; nenhuma
 * lógica de negócio mora mais lá.
 *
 * Filtra por PERÍODO DE PUBLICAÇÃO (não por dataExecucao) — os 4 envios
 * diários da PMJP (08h/09h30/14h/18h) são recortes de horário sobre a
 * base inteira, igual ao pipeline local original (clipping.py filtrava
 * por `Data de publicação`, não por qual dia a notícia foi importada).
 * Só Rádio/TV entram — a PMJP não recebe cobertura Online.
 */
export async function exportarPorHorarioAction(
  data: string,
  horario: Horario,
): Promise<{ ok: boolean; mensagens?: string[]; message?: string }> {
  await requireUserId();

  if (!data) return { ok: false, message: "Informe a data." };

  const { inicio, fim } = calcularPeriodo(data, horario);

  const noticias = await prisma.noticia.findMany({
    where: {
      tipoVeiculo: { in: ["Rádio", "Televisão"] },
      dataPublicacao: { gte: inicio, lte: fim },
    },
  });

  if (noticias.length === 0) {
    return { ok: false, message: "Nenhuma notícia encontrada nesse período." };
  }

  const naoProcessadas = noticias.filter((n) => n.resumo === null);
  if (naoProcessadas.length > 0) {
    return {
      ok: false,
      message: `Ainda há ${naoProcessadas.length} notícia(s) não processada(s) nesse período — processe em "Revisar" antes de exportar.`,
    };
  }

  const mensagens = montarMensagens(noticias);
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
export async function exportarBaseCompletaAction(): Promise<
  { ok: true; json: string; filename: string } | { ok: false; message: string }
> {
  await requireUserId();

  const noticias = await prisma.noticia.findMany({
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

  const vendor = montarExportVendor(noticias, PERSONAGEM);
  return { ok: true, json: JSON.stringify(vendor, null, 4), filename: "prefeitura.json" };
}
