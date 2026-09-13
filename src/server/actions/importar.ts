"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { parseClippingExport } from "@/lib/clipping";
import type { ActionState } from "@/lib/validations";

/**
 * Porta de mergeJson.py — em vez de consolidar arquivos de página em disco
 * (dadosPag/*.json), recebe o JSON de UMA página colado diretamente no
 * formulário. Dedup por (noticiaId, dataExecucao) faz o papel do merge:
 * colar a página 1, depois a página 2, depois a 3 (mesmo fluxo de ir
 * soltando pag1.json, pag2.json... antes) acumula tudo sem duplicar, mesmo
 * que a mesma notícia apareça em mais de uma página colada.
 */
export async function importarAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUserId();

  const jsonTexto = String(formData.get("jsonTexto") ?? "").trim();
  const dataExecucao = String(formData.get("dataExecucao") ?? "");

  if (!jsonTexto) {
    return { ok: false, message: "Cole o JSON exportado da plataforma de clipping." };
  }
  if (!dataExecucao) {
    return { ok: false, message: "Informe a data do disparo." };
  }

  let json: unknown;
  try {
    json = JSON.parse(jsonTexto);
  } catch {
    return { ok: false, message: "O texto colado não é um JSON válido." };
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

  const totalNaData = await prisma.noticia.count({ where: { dataExecucao } });

  revalidatePath("/revisar");
  return {
    ok: true,
    message: `+${novos.length} nova(s) (${itens.length - novos.length} já existiam nessa página) — ${totalNaData} no total em ${dataExecucao}.`,
  };
}
