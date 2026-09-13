"use server";

import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { montarMensagens } from "@/lib/formatador";

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
