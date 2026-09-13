"use server";

import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { montarMensagens } from "@/lib/formatador";
import { montarExportVendor } from "@/lib/vendorExport";
import { PERSONAGEM } from "@/lib/config";

/**
 * Gera a lista de mensagens no formato final de envio — o mesmo formato
 * que formatador.py produz localmente. O script local (main.py) passa a
 * ler esse JSON exportado em vez de gerar as mensagens ele mesmo; a lógica
 * de disparo no WhatsApp (whatsapp.py) não muda.
 */
export async function exportarDiaAction(
  dataExecucao: string,
): Promise<{ ok: boolean; mensagens?: string[]; message?: string }> {
  await requireUserId();

  if (!dataExecucao) return { ok: false, message: "Informe a data." };

  const noticias = await prisma.noticia.findMany({ where: { dataExecucao } });
  if (noticias.length === 0) {
    return { ok: false, message: "Nenhuma notícia encontrada para essa data." };
  }

  const naoProcessadas = noticias.filter((n) => n.resumo === null);
  if (naoProcessadas.length > 0) {
    return {
      ok: false,
      message: `Ainda há ${naoProcessadas.length} notícia(s) não processada(s) — processe todas antes de exportar.`,
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
