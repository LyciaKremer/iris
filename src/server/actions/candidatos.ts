"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/validations";

const SLUG_VALIDO = /^[a-z0-9-]+$/;

/** Cadastro de candidato — substitui editar o dicionário CANDIDATOS em
 * candidatos.py na mão. `tipo` decide, em todo o app, qual prompt/taxonomia/
 * grade de horário usar (ver anthropic.ts, sentimento.ts, tema.ts, horarios.ts). */
export async function criarCandidatoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUserId();

  const nome = String(formData.get("nome") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const tipo = String(formData.get("tipo") ?? "");
  const clippingMonitoringId = String(formData.get("clippingMonitoringId") ?? "").trim() || null;

  if (!nome) return { ok: false, message: "Informe o nome." };
  if (!slug || !SLUG_VALIDO.test(slug)) {
    return { ok: false, message: "Slug inválido — use só letras minúsculas, números e hífen." };
  }
  if (tipo !== "pessoa" && tipo !== "instituicao") {
    return { ok: false, message: "Selecione o tipo (pessoa ou instituição)." };
  }

  const existente = await prisma.candidato.findUnique({ where: { slug } });
  if (existente) return { ok: false, message: `Já existe um candidato com o slug '${slug}'.` };

  await prisma.candidato.create({ data: { nome, slug, tipo, clippingMonitoringId } });

  revalidatePath("/candidatos");
  return { ok: true, message: `'${nome}' cadastrado.` };
}

/** Edita nome/clippingMonitoringId/ativo — NÃO o slug nem o tipo: trocar o
 * slug quebraria toda URL/link já compartilhado, e trocar o tipo no meio do
 * caminho misturaria classificações de taxonomias diferentes no histórico
 * do mesmo candidato. */
export async function atualizarCandidatoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUserId();

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const clippingMonitoringId = String(formData.get("clippingMonitoringId") ?? "").trim() || null;

  if (!id) return { ok: false, message: "Candidato não identificado." };
  if (!nome) return { ok: false, message: "Informe o nome." };

  await prisma.candidato.update({ where: { id }, data: { nome, clippingMonitoringId } });

  revalidatePath("/candidatos");
  return { ok: true, message: "Candidato atualizado." };
}

/** Soft-delete: some do seletor sem apagar as notícias já processadas
 * (histórico/auditoria continuam intactos). */
export async function alternarAtivoCandidatoAction(
  id: string,
  ativo: boolean,
): Promise<{ ok: boolean; message?: string }> {
  await requireUserId();
  if (!id) return { ok: false, message: "Candidato não identificado." };

  await prisma.candidato.update({ where: { id }, data: { ativo } });
  revalidatePath("/candidatos");
  return { ok: true };
}
