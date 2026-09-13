"use server";

import { requireUserId } from "@/lib/dal";
import { buscarNoticias } from "@/server/queries/auditoria";

export async function buscarNoticiasAction(termo: string) {
  await requireUserId();
  return buscarNoticias(termo);
}
