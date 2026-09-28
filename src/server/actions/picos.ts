"use server";

import { requireUserId } from "@/lib/dal";
import { calcularPicos, type Pico } from "@/server/queries/picos";

export async function calcularPicosAction(
  candidatoId: string,
  dias: number,
  limiar: number,
): Promise<{ ok: true; picos: Pico[] } | { ok: false; message: string }> {
  await requireUserId();
  const picos = await calcularPicos(candidatoId, dias, 4, limiar);
  return { ok: true, picos };
}
