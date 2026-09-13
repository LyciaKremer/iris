import "server-only";
import { askClaude, prepararTranscricao } from "@/lib/anthropic";

// Modelo mais forte que o de geração, de propósito — não é o mesmo
// "cérebro" se auto-validando, é uma segunda opinião de um modelo melhor.
const MODELO_VERIFICACAO = "claude-sonnet-5";

export type ResultadoVerificacao = {
  correto: boolean;
  problema?: string;
  resumoCorrigido?: string;
};

function extrairJson(resposta: string): unknown {
  const semFences = resposta.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(semFences);
}

/**
 * Porta de verificar_resumo() (verificacao.py) — sem cache interno (quem
 * chama decide se guarda o resultado). Em caso de qualquer falha (API,
 * JSON inválido, campo ausente), falha-aberto: retorna `{correto: true}`
 * sem marcar nada como definitivamente errado — mesma filosofia do
 * Python, pra nunca "congelar" uma correção baseada numa falha transitória.
 */
export async function verificarResumo(
  transcricao: string,
  resumo: string,
  personagem: string,
): Promise<ResultadoVerificacao> {
  const texto = prepararTranscricao(transcricao);

  const prompt = `Você é um revisor de clipping da ${personagem}. Abaixo estão a transcrição original e um resumo gerado a partir dela.

Verifique se o resumo é fiel à transcrição, checando especialmente:
- Se os nomes de pessoas citadas não foram trocados ou inventados
- Se falas/opiniões/ações não foram atribuídas à pessoa errada (especialmente à ${personagem} quando na verdade é outra pessoa falando)
- Se não há fatos no resumo que não aparecem literalmente na transcrição

Transcrição:
${texto}

Resumo a verificar:
${resumo}

Se estiver tudo certo, responda APENAS com: {"correto": true}
Se houver problema, responda APENAS com: {"correto": false, "problema": "<explicação breve>", "resumo_corrigido": "<resumo corrigido, fiel à transcrição>"}

Nada além do JSON, sem comentários adicionais.`;

  try {
    const resposta = await askClaude(prompt, 2000, MODELO_VERIFICACAO);
    const resultado = extrairJson(resposta) as Record<string, unknown>;

    if (typeof resultado.correto !== "boolean") {
      throw new Error("Resposta da verificação sem o campo 'correto'.");
    }

    return {
      correto: resultado.correto,
      problema: typeof resultado.problema === "string" ? resultado.problema : undefined,
      resumoCorrigido:
        typeof resultado.resumo_corrigido === "string" ? resultado.resumo_corrigido : undefined,
    };
  } catch (erro) {
    console.error(`[ERRO] Falha na verificação: ${erro}`);
    return { correto: true };
  }
}
