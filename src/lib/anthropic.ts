import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-haiku-4-5-20251001";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Porta fiel de perguntar_claude() do pipeline Python (llm.py). Não envia
 * `temperature` (modelos mais novos, como o Sonnet 5, ajustam isso via
 * "thinking" adaptativo e rejeitam o parâmetro). Nunca assume que o
 * primeiro bloco da resposta é texto — um modelo com thinking adaptativo
 * pode antepor um bloco de pensamento antes do texto de verdade.
 */
export async function askClaude(
  prompt: string,
  maxTokens = 400,
  modelo?: string,
): Promise<string> {
  const resposta = await client.messages.create({
    model: modelo ?? MODELO,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  console.log(
    `[TOKENS] entrada=${resposta.usage.input_tokens} saida=${resposta.usage.output_tokens}`,
  );

  for (const bloco of resposta.content) {
    if (bloco.type === "text") {
      return bloco.text.trim();
    }
  }

  throw new Error(
    `Resposta da API sem nenhum bloco de texto (stop_reason=${resposta.stop_reason}) ` +
      "— provavelmente truncada em max_tokens ainda durante o 'thinking'. " +
      "Aumente max_tokens nessa chamada.",
  );
}

const TETO_CARACTERES = 20_000;

export function prepararTranscricao(transcricao: string | null | undefined): string {
  if (!transcricao) return "";
  const texto = transcricao.replace(/\n/g, " ").trim();
  return texto.length > TETO_CARACTERES ? texto.slice(0, TETO_CARACTERES) : texto;
}

/** Resumo genérico (2 frases) usado só pra auditoria interna quando não há
 * nada relevante à gestão municipal — não é mostrado ao usuário final. */
export async function gerarResumoGeral(texto: string): Promise<string> {
  if (!texto) return "";

  const prompt = `Resuma em até 2 frases, de forma objetiva e factual, qual é o assunto principal da transcrição abaixo. Este resumo é apenas para controle interno de arquivo — não precisa mencionar nenhuma pessoa específica, só o tema geral.

Transcrição:
${texto}

Resposta (até 2 frases, apenas o assunto geral):`;

  try {
    return (await askClaude(prompt, 150)).trim();
  } catch (erro) {
    console.error(`[ERRO] Falha ao gerar resumo geral: ${erro}`);
    return "";
  }
}

export type ResultadoClipping = {
  resumo: string;
  relevante: boolean;
  resumoTranscricao?: string;
};

/**
 * Porta de gerar_clipping() (llm.py) — SEM a checagem de cache: quem chama
 * (a Server Action de processamento) decide se já existe um `resumo`
 * gravado na linha da Notícia antes de chamar isso.
 *
 * O personagem monitorado aqui é uma instituição (a Prefeitura de João
 * Pessoa), não uma pessoa — por isso o prompt reconhece relevância sempre
 * que a transcrição tratar do prefeito, de uma secretaria, de um serviço
 * público municipal ou de uma reclamação/elogio dirigido à gestão, mesmo
 * sem citar "prefeitura" literalmente.
 */
export async function gerarClipping(
  transcricao: string,
  personagem: string,
): Promise<ResultadoClipping> {
  const texto = prepararTranscricao(transcricao);

  const prompt = `Você é um analista de clipping da ${personagem}. Sua única fonte de informação é a transcrição abaixo — nunca use conhecimento prévio, apenas o que está escrito na transcrição.

TAREFA: narre o assunto/cena da transcrição do jeito que um repórter narraria uma pauta de rádio ou TV, focando no que diz respeito à gestão municipal.

É RELEVANTE sempre que a transcrição mencionar: o prefeito, qualquer secretaria/órgão da prefeitura, um serviço público ou obra municipal, ou uma reclamação/elogio dirigido à gestão municipal — mesmo que não use literalmente o nome "${personagem}".

COMO ESCREVER:
- Descreva a situação (uma entrevista, um comentário de ouvinte, uma reclamação, um anúncio) da forma mais fiel possível ao que foi dito.
- Use citação direta entre aspas quando a fala literal for relevante.
- Terceira pessoa. Sem markdown, emojis ou hashtags. 2 a 4 frases.

REGRAS RÍGIDAS:
- Use apenas fatos que aparecem literalmente na transcrição.
- Não infira, não conclua, não complete lacunas.
- Se a transcrição não tiver NENHUMA relação com a prefeitura, a gestão municipal, secretarias ou serviços públicos, responda exatamente: "Sem informação relevante."
- Responda apenas com o resumo, sem comentários adicionais.

Transcrição:
${texto}

Resposta (2 a 4 frases, narrando o assunto/cena):`;

  let resumo: string;
  try {
    resumo = (await askClaude(prompt)).trim();
  } catch (erro) {
    console.error(`[ERRO] Falha ao chamar a API da Anthropic: ${erro}`);
    resumo = "Sem informação relevante.";
  }

  const resumoLower = resumo.toLowerCase();
  const semInfo =
    !resumo ||
    resumoLower.startsWith("sem informação") ||
    resumoLower.startsWith("não há") ||
    resumoLower.startsWith("nao ha");

  if (semInfo) {
    const resumoTranscricao = await gerarResumoGeral(texto);
    return { resumo: "", relevante: false, resumoTranscricao };
  }

  return { resumo, relevante: true };
}
