"use server";

import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { obterChecklistDoDia } from "@/server/queries/checklist";

export async function obterChecklistAction(
  data: string,
): Promise<{ ok: true; itens: Record<string, boolean> } | { ok: false; message: string }> {
  await requireUserId();
  if (!data) return { ok: false, message: "Data inválida." };
  const itens = await obterChecklistDoDia(data);
  return { ok: true, itens };
}

export async function alternarItemChecklistAction(
  data: string,
  chave: string,
  concluido: boolean,
): Promise<{ ok: boolean; message?: string }> {
  await requireUserId();
  if (!data || !chave) return { ok: false, message: "Item inválido." };

  const existente = await prisma.checklistDia.findUnique({ where: { data } });
  const itens = { ...((existente?.itens as Record<string, boolean>) ?? {}), [chave]: concluido };

  await prisma.checklistDia.upsert({
    where: { data },
    update: { itens },
    create: { data, itens },
  });

  return { ok: true };
}
