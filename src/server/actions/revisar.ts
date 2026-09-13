"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/validations";

/** Correção manual do resumo/sentimento/secretaria — o fluxo de revisão que
 * hoje é feito comparando com a transcrição num chat à parte. */
export async function salvarRevisaoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUserId();

  const id = String(formData.get("id") ?? "");
  const resumo = String(formData.get("resumo") ?? "");
  const sentimentoFinal = String(formData.get("sentimentoFinal") ?? "");
  const secretaria = String(formData.get("secretaria") ?? "");

  if (!id) return { ok: false, message: "Notícia não identificada." };

  const noticia = await prisma.noticia.findUnique({ where: { id }, select: { id: true } });
  if (!noticia) return { ok: false, message: "Notícia não encontrada." };

  await prisma.noticia.update({
    where: { id },
    data: { resumo, sentimentoFinal, secretaria, revisadoManualmente: true },
  });

  revalidatePath("/revisar");
  return { ok: true, message: "Revisão salva." };
}
