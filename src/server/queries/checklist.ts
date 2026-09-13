import "server-only";
import { prisma } from "@/lib/prisma";

export async function obterChecklistDoDia(data: string): Promise<Record<string, boolean>> {
  const registro = await prisma.checklistDia.findUnique({ where: { data } });
  return (registro?.itens as Record<string, boolean>) ?? {};
}
