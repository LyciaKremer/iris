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

export type TipoCandidato = "pessoa" | "instituicao";

function promptClippingInstituicao(personagem: string, texto: string): string {
  return `Você é um analista de clipping da ${personagem}. Sua única fonte de informação é a transcrição abaixo — nunca use conhecimento prévio, apenas o que está escrito na transcrição.

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
}

/**
 * Porta fiel de gerar_clipping() (alertas-wpp/llm.py) — o personagem
 * monitorado aqui é uma PESSOA (candidato político), citada/entrevistada
 * por terceiros o tempo todo. As regras de "quem está de fato falando"
 * existem porque essa é a classe de erro real que a verificação (segunda
 * IA) pega: atribuir a fala de um entrevistado ao personagem só porque ele
 * foi citado pelo nome.
 */
function promptClippingPessoa(personagem: string, texto: string): string {
  return `Você é um analista de clipping político. Sua única fonte de informação é a transcrição abaixo — nunca use conhecimento prévio sobre o personagem, apenas o que está escrito na transcrição.

Personagem monitorado: ${personagem}

TAREFA: narre o assunto/cena da transcrição do jeito que um repórter narraria uma pauta de rádio ou TV — não como uma nota genérica sobre ${personagem}.

COMO ESCREVER:
- Descreva a situação (uma entrevista, uma sonora, um comentário de ouvinte, um debate) e deixe ${personagem} entrar organicamente na narrativa — como quem fala, quem é perguntado, quem é mencionado, ou o assunto em discussão.
- NÃO repita fórmulas como "${personagem} é citado como...", "${personagem} é apontado como...", "${personagem} afirma que..." em toda frase. O sujeito da frase deve ser quem melhor representa a ação (o entrevistador, o ouvinte, o programa, o próprio personagem — o que fizer mais sentido pro que está sendo narrado).
- Use citação direta entre aspas quando a fala literal for relevante.
- Terceira pessoa. Sem markdown, emojis ou hashtags. 2 a 4 frases.

Exemplos do estilo esperado (repare como a estrutura da frase muda conforme o tipo de conteúdo — nenhum deles segue uma fórmula fixa):

[Pergunta e resposta em entrevista]
Luís Torres pergunta se o deputado estará no palanque de Walber Virgolino para as eleições em Cabedelo. Entrevistado em estúdio, o deputado federal Gilberto Silva responde que "sem dúvida nenhuma, zero mágoa. O partido já escolheu e faremos nossa parte. Zero problema com isso".

[Sonora reprisada]
Em sonora reprisada, o deputado federal Cabo Gilberto comentou a possibilidade de apoiar o deputado estadual Wallber Virgolino na disputa das eleições suplementares de Cabedelo.

[Comentário de ouvinte]
Uma ouvinte disse que a verdadeira confusão está na cidade de Cabedelo, relatando que a praia está suja, não há onde estacionar, e que o município vive um verdadeiro caos.

[Participação em série de entrevistas]
A série de entrevistas com pré-candidatos ao governo teve início na segunda-feira com a participação de ${personagem}, abrindo o ciclo que também recebeu outros concorrentes ao cargo.

REGRAS RÍGIDAS:
- Use apenas fatos que aparecem literalmente na transcrição.
- Não infira, não conclua, não complete lacunas.
- Identifique com cuidado QUEM está de fato falando na transcrição (o entrevistado/locutor) versus quem é apenas MENCIONADO por essa pessoa. Nunca descreva uma conversa, diálogo ou troca entre ${personagem} e outra pessoa a menos que a transcrição mostre claramente falas das duas partes. Se só uma pessoa fala e cita ${personagem} pelo nome, deixe claro que é ELA quem fala sobre ${personagem} — não que os dois estão dialogando.
- Se a transcrição identificar outra pessoa nomeada como entrevistado(a)/locutor(a) (ex: um repórter apresenta "fulano" como convidado), NUNCA atribua as falas em primeira pessoa ("eu", "meu", "nós") dessa pessoa a ${personagem} — mesmo que ${personagem} seja citado pelo nome dentro dessas falas. Todo trecho em primeira pessoa pertence a quem foi apresentado como quem fala, nunca a ${personagem}, a menos que a transcrição mostre ${personagem} sendo apresentado como o entrevistado/locutor.
- Se a transcrição não tiver relação clara com ${personagem}, responda exatamente: "Sem informação relevante."
- Responda apenas com o resumo, sem comentários adicionais.

Transcrição:
${texto}

Resposta (2 a 4 frases, narrando o assunto/cena, com ${personagem} inserido organicamente):`;
}

/**
 * Porta de gerar_clipping() (llm.py) — SEM a checagem de cache: quem chama
 * (a Server Action de processamento) decide se já existe um `resumo`
 * gravado na linha da Notícia antes de chamar isso.
 *
 * `tipo` decide qual prompt usar: "instituicao" (PMJP) trata o personagem
 * como órgão/gestão municipal; "pessoa" (candidatos) trata como alguém
 * citado/entrevistado por terceiros, com as regras de atribuição de fala
 * que isso exige.
 */
export async function gerarClipping(
  transcricao: string,
  personagem: string,
  tipo: TipoCandidato,
): Promise<ResultadoClipping> {
  const texto = prepararTranscricao(transcricao);

  const prompt =
    tipo === "instituicao"
      ? promptClippingInstituicao(personagem, texto)
      : promptClippingPessoa(personagem, texto);

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
