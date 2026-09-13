"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { gerarClipping } from "@/lib/anthropic";
import { validarSentimento } from "@/lib/sentimento";
import { validarSecretaria } from "@/lib/secretaria";
import { PERSONAGEM } from "@/lib/config";

/**
 * Processa UMA notícia por vez (não em lote) — funções serverless do plano
 * grátis da Vercel têm limite curto de duração, e cada item pode disparar
 * várias chamadas sequenciais à Claude. Chamado por item a partir da tela
 * de revisão, o que também combina com o fluxo de revisão manual.
 *
 * Idempotente: se `resumo` já está preenchido, não reprocessa (equivalente
 * ao cache-first do pipeline Python).
 */
export async function processarItemAction(id: string): Promise<{ ok: boolean; message?: string }> {
  await requireUserId();

  const noticia = await prisma.noticia.findUnique({ where: { id } });
  if (!noticia) return { ok: false, message: "Notícia não encontrada." };
  if (noticia.resumo !== null) return { ok: true };

  const ehOnline = noticia.tipoVeiculo === "Online";

  let resumo: string;
  let relevante: boolean;

  if (ehOnline) {
    // Online já vem com título editorial pronto — nunca gera resumo por
    // IA, sempre considerado relevante (replica processador.py).
    resumo = noticia.tituloOriginal;
    relevante = true;
  } else {
    try {
      const resultado = await gerarClipping(noticia.transcricao ?? "", PERSONAGEM);
      resumo = resultado.resumo;
      relevante = resultado.relevante;
    } catch (erro) {
      return { ok: false, message: `Falha ao gerar resumo: ${String(erro)}` };
    }
  }

  // Assimetria por tipo de veículo (processador.py): Online usa a
  // transcrição (ou o título, na ausência dela) pra sentimento/secretaria;
  // Rádio/TV usam o resumo gerado. Itens irrelevantes de Rádio/TV não
  // chamam a IA — sentimento mantém o original, secretaria vira "Outro".
  let sentimentoFinal = noticia.sentimentoOriginal;
  let secretaria = "Outro";

  if (ehOnline || relevante) {
    const textoClassificacao = ehOnline ? noticia.transcricao || noticia.tituloOriginal : resumo;

    try {
      sentimentoFinal = await validarSentimento(textoClassificacao, noticia.sentimentoOriginal, PERSONAGEM);
    } catch (erro) {
      return { ok: false, message: `Falha ao validar sentimento: ${String(erro)}` };
    }

    try {
      secretaria = await validarSecretaria(textoClassificacao);
    } catch (erro) {
      return { ok: false, message: `Falha ao classificar secretaria: ${String(erro)}` };
    }
  }

  await prisma.noticia.update({
    where: { id },
    data: { resumo, relevante, sentimentoFinal, secretaria },
  });

  revalidatePath("/revisar");
  return { ok: true };
}
