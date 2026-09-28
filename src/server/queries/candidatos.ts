import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type TipoCandidato = "pessoa" | "instituicao";

/** Memoizado por requisição (React cache) — várias páginas/layouts sob o
 * mesmo segmento [candidato] podem chamar isso sem gerar N queries iguais. */
export const getCandidatoPorSlug = cache(async (slug: string) => {
  const candidato = await prisma.candidato.findUnique({ where: { slug } });
  if (!candidato || !candidato.ativo) notFound();
  return candidato;
});

export const listarCandidatosAtivos = cache(async () => {
  return prisma.candidato.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
});

export async function listarCandidatosTodos() {
  return prisma.candidato.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] });
}
