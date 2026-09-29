"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { gerarClipping, resumoIndicaSemInformacao } from "@/lib/anthropic";
import { verificarResumo } from "@/lib/verificacao";
import { validarSentimento } from "@/lib/sentimento";
import { validarSecretaria } from "@/lib/secretaria";
import { validarTema } from "@/lib/tema";
import { listarPendentesPorHorario, type PendenteVM } from "@/server/queries/noticias";
import type { Horario } from "@/lib/horarios";

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

  const noticia = await prisma.noticia.findUnique({ where: { id }, include: { candidato: true } });
  if (!noticia) return { ok: false, message: "Notícia não encontrada." };
  if (noticia.resumo !== null) return { ok: true };

  const personagem = noticia.candidato.nome;
  const tipo = noticia.candidato.tipo as "pessoa" | "instituicao";
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
      const resultado = await gerarClipping(noticia.transcricao ?? "", personagem, tipo);
      resumo = resultado.resumo;
      relevante = resultado.relevante;
    } catch (erro) {
      return { ok: false, message: `Falha ao gerar resumo: ${String(erro)}` };
    }
  }

  // Segunda checagem por um modelo mais forte (verificacao.py) — só pra
  // Rádio/TV relevantes, e ANTES de sentimento/secretaria, porque essas
  // classificações devem usar o resumo já corrigido, não o original.
  let resumoOriginal: string | null = null;
  let problemaDetectado: string | null = null;
  let revisadoPelaIa = false;

  if (!ehOnline && relevante) {
    const verificacao = await verificarResumo(noticia.transcricao ?? "", resumo, personagem, tipo);
    if (!verificacao.correto) {
      resumoOriginal = resumo;
      problemaDetectado = verificacao.problema ?? "";
      revisadoPelaIa = true;
      resumo = verificacao.resumoCorrigido || resumo;

      // A correção pode concluir que, tirando o trecho mal atribuído, não
      // sobra nada de fato relevante sobre o personagem — nesse caso o
      // item precisa virar "sem relevância" de verdade (some do disparo),
      // não ficar com um resumo tipo "Sem informação relevante." vazando
      // pra mensagem como se fosse um clipping normal.
      if (resumoIndicaSemInformacao(resumo)) {
        relevante = false;
        resumo = "";
      }
    }
  }

  // Assimetria por tipo de veículo (processador.py): Online usa a
  // transcrição (ou o título, na ausência dela) pra sentimento/secretaria;
  // Rádio/TV usam o resumo gerado (já corrigido, se a verificação achou
  // problema). Itens irrelevantes de Rádio/TV não chamam a IA —
  // sentimento mantém o original, secretaria vira "Outro".
  let sentimentoFinal = noticia.sentimentoOriginal;
  let secretaria = "Outro";

  if (ehOnline || relevante) {
    const textoClassificacao = ehOnline ? noticia.transcricao || noticia.tituloOriginal : resumo;

    try {
      sentimentoFinal = await validarSentimento(textoClassificacao, noticia.sentimentoOriginal, personagem, tipo);
    } catch (erro) {
      return { ok: false, message: `Falha ao validar sentimento: ${String(erro)}` };
    }

    try {
      // "secretaria" é o nome da coluna pros dois tipos — pra candidatos
      // "pessoa" ela guarda o tema político (tema.ts), não a secretaria
      // municipal (secretaria.ts).
      secretaria =
        tipo === "instituicao"
          ? await validarSecretaria(textoClassificacao)
          : await validarTema(textoClassificacao, personagem);
    } catch (erro) {
      return { ok: false, message: `Falha ao classificar tema/secretaria: ${String(erro)}` };
    }
  }

  await prisma.noticia.update({
    where: { id },
    data: {
      resumo,
      relevante,
      sentimentoFinal,
      secretaria,
      revisadoPelaIa,
      resumoOriginal,
      problemaDetectado,
    },
  });

  revalidatePath(`/${noticia.candidato.slug}/revisar`);
  return { ok: true };
}

/** Pendentes de um candidato dentro da janela de um horário específico —
 * usado pelo processamento em lote (modal em /candidatos) pra montar a
 * lista (com veículo/tipo, pra mostrar progresso item a item) antes de
 * rodar processarItemAction um a um, por candidato selecionado. Deriva o
 * tipo do próprio candidato — nunca confia no tipo vindo do cliente. */
export async function listarPendentesPorHorarioAction(
  candidatoId: string,
  data: string,
  horario: Horario,
): Promise<PendenteVM[]> {
  await requireUserId();
  const candidato = await prisma.candidato.findUniqueOrThrow({ where: { id: candidatoId } });
  return listarPendentesPorHorario(candidatoId, data, horario, candidato.tipo as "pessoa" | "instituicao");
}
