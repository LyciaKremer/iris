import "server-only";
import { prisma } from "@/lib/prisma";

/** Porta de buscar_noticia.py — busca por id ou por trecho de
 * veículo/título/resumo/transcrição, case-insensitive, escopada a UM
 * candidato (o script Python original também recebia o slug do candidato). */
export async function buscarNoticias(candidatoId: string, termo: string) {
  const termoLimpo = termo.trim();
  if (!termoLimpo) return [];

  return prisma.noticia.findMany({
    where: {
      candidatoId,
      OR: [
        { id: termoLimpo },
        { noticiaId: termoLimpo },
        { veiculo: { contains: termoLimpo, mode: "insensitive" } },
        { tituloOriginal: { contains: termoLimpo, mode: "insensitive" } },
        { resumo: { contains: termoLimpo, mode: "insensitive" } },
        { transcricao: { contains: termoLimpo, mode: "insensitive" } },
      ],
    },
    orderBy: { dataPublicacao: "desc" },
    take: 50,
  });
}
