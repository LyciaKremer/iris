import "server-only";
import { askClaude } from "@/lib/anthropic";

/**
 * Porta de tema.py (alertas-wpp) — taxonomia de candidatos políticos
 * (pessoa), paralela a secretaria.ts (instituição/PMJP). Gravado no mesmo
 * campo `secretaria` da Noticia — o nome da coluna não muda, só o
 * significado do conteúdo pra candidatos do tipo "pessoa".
 */
export const TAXONOMIA_TEMAS = [
  "Eleições e alianças",
  "Gestão pública",
  "Justiça eleitoral / processos",
  "Entrevistas e posicionamentos",
  "Agenda institucional",
  "Crítica da oposição",
  "Repercussão / opinião pública",
  "Outro",
] as const;

async function classificarTema(texto: string, personagem: string): Promise<string> {
  const listaTemas = TAXONOMIA_TEMAS.map((t) => `- ${t}`).join("\n");

  const prompt = `Você é um analista de clipping político. Classifique o tema principal do texto abaixo, em relação a ${personagem}, usando OBRIGATORIAMENTE uma das opções da lista abaixo — nenhuma outra palavra ou categoria.

Temas possíveis:
${listaTemas}

REGRAS:
- Escolha o tema que melhor descreve o assunto principal do texto.
- Se nenhum tema se encaixar bem, responda "Outro".
- Responda APENAS com o nome exato do tema, copiado da lista acima. Nada mais.

Texto:
${texto}

Tema:`;

  return (await askClaude(prompt, 20)).trim();
}

/**
 * Porta de validar_tema() (tema.py) — sem cache interno; quem chama decide
 * se a linha já tem `secretaria` (tema, pra candidatos pessoa) gravado.
 */
export async function validarTema(texto: string, personagem: string): Promise<string> {
  if (!texto) return "Outro";

  let resposta: string;
  try {
    resposta = (await classificarTema(texto, personagem)).trim();
  } catch (erro) {
    console.error(`[ERRO] Falha ao classificar tema: ${erro}`);
    resposta = "Outro";
  }

  const temaValido = TAXONOMIA_TEMAS.find((t) => t.toLowerCase() === resposta.toLowerCase());

  if (!temaValido) {
    console.warn(`[AVISO] Tema inválido retornado: '${resposta}' — usando 'Outro'.`);
    return "Outro";
  }

  return temaValido;
}
