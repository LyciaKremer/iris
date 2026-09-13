import "server-only";
import { prisma } from "@/lib/prisma";

/** Porta de buscar_noticia.py — busca por id ou por trecho de
 * veículo/título/resumo/transcrição, case-insensitive. */
export async function buscarNoticias(termo: string) {
  const termoLimpo = termo.trim();
  if (!termoLimpo) return [];

  return prisma.noticia.findMany({
    where: {
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
