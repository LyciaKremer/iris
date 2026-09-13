"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { parseClippingExport } from "@/lib/clipping";
import type { ActionState } from "@/lib/validations";

/**
 * Porta de mergeJson.py, adaptada: em vez de consolidar páginas exportadas
 * em disco, recebe o JSON já mesclado (mesmo formato de dados/prefeitura.json)
 * via upload e grava direto no banco. Dedup por (noticiaId, dataExecucao) —
 * subir o mesmo arquivo de novo não duplica itens.
 */
export async function importarAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUserId();

  const arquivo = formData.get("arquivo");
  const dataExecucao = String(formData.get("dataExecucao") ?? "");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, message: "Selecione o arquivo JSON exportado." };
  }
  if (!dataExecucao) {
    return { ok: false, message: "Informe a data do disparo." };
  }

  let json: unknown;
  try {
    json = JSON.parse(await arquivo.text());
  } catch {
    return { ok: false, message: "Arquivo não é um JSON válido." };
  }

  const resultado = parseClippingExport(json);
  if ("erro" in resultado) {
    return { ok: false, message: resultado.erro };
  }

  const { itens } = resultado;
  if (itens.length === 0) {
    return { ok: false, message: "O export não contém nenhum item." };
  }

  const existentes = await prisma.noticia.findMany({
    where: { dataExecucao, noticiaId: { in: itens.map((i) => i.noticiaId) } },
    select: { noticiaId: true },
  });
  const jaExistem = new Set(existentes.map((e) => e.noticiaId));
  const novos = itens.filter((i) => !jaExistem.has(i.noticiaId));

  if (novos.length > 0) {
    await prisma.noticia.createMany({
      data: novos.map((i) => ({
        noticiaId: i.noticiaId,
        dataExecucao,
        veiculo: i.veiculo,
        tipoVeiculo: i.tipoVeiculo,
        tituloOriginal: i.tituloOriginal,
        transcricao: i.transcricao,
        urlMidia: i.urlMidia,
        linkDireto: i.linkDireto,
        sentimentoOriginal: i.sentimentoOriginal,
        dataPublicacao: i.dataPublicacao,
      })),
    });
  }

  revalidatePath("/revisar");
  return {
    ok: true,
    message: `${novos.length} notícia(s) importada(s) (${itens.length - novos.length} já existiam para essa data).`,
  };
}
