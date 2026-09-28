import "server-only";
import { askClaude } from "@/lib/anthropic";
import type { TipoCandidato } from "@/lib/anthropic";

const SENTIMENTOS_VALIDOS = new Set(["positivo", "negativo", "neutro"]);

function promptSentimentoInstituicao(texto: string, personagem: string): string {
  return `Você é um analista de clipping. Sua tarefa é classificar o tom da cobertura EM RELAÇÃO A ${personagem}, usando apenas o texto abaixo.

Classifique o sentimento da cobertura em relação a ${personagem} como exatamente uma destas três opções:
- Positivo
- Negativo
- Neutro

REGRAS:
- Considere apenas o que é dito especificamente sobre ${personagem} (sua gestão, secretarias, serviços públicos), não o tom geral do texto sobre outros assuntos.
- Neutro: menção informativa, sem elogio nem crítica clara.
- Positivo: elogio, conquista, serviço bem avaliado, repercussão favorável.
- Negativo: crítica, reclamação, problema não resolvido, repercussão desfavorável.
- Responda APENAS com uma palavra: Positivo, Negativo ou Neutro. Nada mais, sem pontuação.

Texto:
${texto}

Sentimento:`;
}

/** Porta fiel de classificar_sentimento() (alertas-wpp/sentimento.py) — escopo
 * de pessoa política (apoio/crítica/escândalo), não de gestão institucional. */
function promptSentimentoPessoa(texto: string, personagem: string): string {
  return `Você é um analista de clipping político. Sua tarefa é classificar o tom da cobertura EM RELAÇÃO A um personagem específico, usando apenas o texto abaixo.

Personagem: ${personagem}

Classifique o sentimento da cobertura em relação a ${personagem} como exatamente uma destas três opções:
- Positivo
- Negativo
- Neutro

REGRAS:
- Considere apenas o que é dito especificamente sobre ${personagem}, não o tom geral do texto sobre outros assuntos ou pessoas.
- Neutro: menção informativa, sem elogio nem crítica clara.
- Positivo: elogio, conquista, apoio, repercussão favorável a ${personagem}.
- Negativo: crítica, escândalo, acusação, repercussão desfavorável a ${personagem}.
- Responda APENAS com uma palavra: Positivo, Negativo ou Neutro. Nada mais, sem pontuação.

Texto:
${texto}

Sentimento:`;
}

async function classificarSentimento(texto: string, personagem: string, tipo: TipoCandidato): Promise<string> {
  const prompt =
    tipo === "instituicao"
      ? promptSentimentoInstituicao(texto, personagem)
      : promptSentimentoPessoa(texto, personagem);

  return (await askClaude(prompt, 10)).trim();
}

/**
 * Porta de validar_sentimento() (sentimento.py) — sem cache interno; quem
 * chama decide se a linha já tem `sentimentoFinal` gravado.
 */
export async function validarSentimento(
  texto: string,
  sentimentoAtual: string,
  personagem: string,
  tipo: TipoCandidato,
): Promise<string> {
  if (!texto) return sentimentoAtual;

  let resposta: string;
  try {
    resposta = await classificarSentimento(texto, personagem, tipo);
  } catch (erro) {
    console.error(`[ERRO] Falha ao validar sentimento: ${erro}`);
    resposta = sentimentoAtual;
  }

  const respostaNormalizada = capitalize(resposta.trim().replace(/\.$/, ""));

  if (!SENTIMENTOS_VALIDOS.has(respostaNormalizada.toLowerCase())) {
    console.warn(
      `[AVISO] Resposta de sentimento inválida: '${resposta}' — mantendo original ('${sentimentoAtual}').`,
    );
    return sentimentoAtual;
  }

  return respostaNormalizada;
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}
