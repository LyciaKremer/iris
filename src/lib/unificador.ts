import "server-only";
import { askClaude } from "@/lib/anthropic";

/**
 * Porta de unificador.py (alertas-wpp) — agrupa Rádio/TV que cobrem o
 * MESMO fato/citação concreta e funde os resumos num texto só, antes de
 * virar mensagem (formatador.ts). Online nunca passa por isso: cada
 * matéria já tem sua própria URL/fonte, fundir custaria caro sem
 * benefício real e ainda geraria ruído no relatório de temas.
 *
 * Sem cache persistente (diferente do Python, que cacheava em
 * cache/<candidato>/agrupamentos.json e mesclagens.json): aqui a
 * exportação é uma ação manual sob demanda, não um script agendado que
 * reprocessa o mesmo lote repetidamente — o custo de recomputar num
 * clique extra é baixo. Reconsiderar se isso virar um padrão de uso caro.
 */

export type NoticiaUnificavel = {
  id: string;
  veiculo: string;
  tipoVeiculo: string;
  sentimentoFinal: string | null;
  sentimentoOriginal: string;
  secretaria: string | null;
  resumo: string | null;
  relevante: boolean | null;
  // Só preenchido (e só relevante) pra Online — usado pelo formato "pessoa"
  // do formatador.ts (link direto da matéria, como em alertas-wpp).
  linkDireto?: string | null;
};

function bucketKey(n: NoticiaUnificavel): string {
  return `${n.tipoVeiculo}|${n.sentimentoFinal ?? n.sentimentoOriginal}`;
}

/** Mesmo critério de relevância usado pelo formatador: Rádio/TV sem resumo
 * relevante não entram. Online sempre é elegível — isso só decide o que
 * aparece no disparo, não quem passa pela fusão via IA (ver mais abaixo). */
export function filtrarElegiveis(noticias: NoticiaUnificavel[]): NoticiaUnificavel[] {
  return noticias.filter(
    (n) => !(["Rádio", "Televisão"].includes(n.tipoVeiculo) && n.relevante === false),
  );
}

function extrairJson(resposta: string): unknown {
  const semFences = resposta.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(semFences);
}

/**
 * Recebe notícias do mesmo tipo de veículo e sentimento e retorna uma
 * lista de grupos (listas de índices) — notícias que tratam do mesmo
 * fato/citação concreta ficam no mesmo grupo.
 */
async function agruparPorSimilaridade(itens: NoticiaUnificavel[], personagem: string): Promise<number[][]> {
  if (itens.length < 2) return itens.map((_, i) => [i]);

  const lista = itens.map((item, i) => `[${i}] (${item.veiculo}) ${item.resumo}`).join("\n");

  const prompt = `Você é um editor de clipping político. Abaixo está uma lista de resumos de notícias sobre ${personagem}, cada um vindo de um veículo diferente, no mesmo período e com o mesmo sentimento.

Agrupe os itens que tratam do MESMO fato/citação/acontecimento concreto — não apenas do mesmo tema genérico. Só agrupe quando é visivelmente a mesma notícia contada por veículos diferentes (ex: todos cobrindo a mesma declaração, o mesmo evento, a mesma entrevista). Itens sobre assuntos parecidos mas que são fatos distintos NÃO devem ser agrupados.

Itens:
${lista}

Responda APENAS com um JSON no formato {"grupos": [[indices], [indices], ...]}, onde cada índice de 0 a ${itens.length - 1} aparece em exatamente um grupo. Não inclua nenhum texto além do JSON.`;

  const maxTokens = Math.min(4096, 200 + 40 * itens.length);

  try {
    const resposta = await askClaude(prompt, maxTokens);
    const grupos = (extrairJson(resposta) as { grupos: number[][] }).grupos;

    const indicesVistos = grupos.flat().sort((a, b) => a - b);
    const indicesEsperados = itens.map((_, i) => i);
    if (JSON.stringify(indicesVistos) !== JSON.stringify(indicesEsperados)) {
      throw new Error("Agrupamento não cobre todos os índices exatamente uma vez.");
    }
    return grupos;
  } catch (erro) {
    console.error(`[ERRO] Falha ao agrupar notícias similares: ${erro}`);
    return itens.map((_, i) => [i]);
  }
}

const MARCADORES_RECUSA = [
  "não consigo",
  "não posso",
  "não é possível",
  "desculpe",
  "peço desculpas",
  "como ia",
  "como modelo de linguagem",
];

/** Detecta quando a IA devolveu uma recusa/pedido de esclarecimento em vez
 * do texto fundido — ex: quando os resumos do grupo já são idênticos e não
 * sobra "informação extra" pra incorporar, o modelo pode travar em vez de
 * simplesmente devolver o texto compartilhado. */
function pareceRecusa(texto: string): boolean {
  const inicio = texto.trim().toLowerCase().slice(0, 40);
  return MARCADORES_RECUSA.some((m) => inicio.startsWith(m));
}

/** Funde os resumos de um grupo de notícias sobre o mesmo fato num único
 * texto, preservando informação extra relevante de itens que tragam algo
 * além do fato compartilhado. */
async function mesclarGrupo(itensDoGrupo: NoticiaUnificavel[], personagem: string): Promise<string> {
  const titulosUnicos = new Set(itensDoGrupo.map((i) => i.resumo));
  if (titulosUnicos.size === 1) {
    // Todos os resumos do grupo já são idênticos — nada pra fundir, e pedir
    // isso à IA só arrisca uma recusa.
    return itensDoGrupo[0].resumo ?? "";
  }

  const resumos = itensDoGrupo.map((item) => `[${item.veiculo}]\n${item.resumo}`).join("\n\n");

  const prompt = `Você é um analista de clipping político. Abaixo estão resumos de diferentes veículos cobrindo o MESMO fato/acontecimento sobre ${personagem}.

Funda os resumos em um único texto narrado, evitando repetir o mesmo fato várias vezes. Se algum resumo trouxer uma informação adicional relevante que os outros não têm, incorpore essa informação de forma breve, atribuída ao veículo correspondente — sem inflar o texto repetindo o fato principal.

COMO ESCREVER:
- Terceira pessoa, sem markdown, emojis ou hashtags.
- Narre o fato central uma vez só, do jeito mais completo possível.
- 2 a 5 frases.
- Use citação direta entre aspas quando a fala literal for relevante.

Resumos:
${resumos}

Resposta (texto único, fundido):`;

  try {
    const resultado = (await askClaude(prompt, 400)).trim();
    if (pareceRecusa(resultado)) {
      throw new Error(`IA recusou a mesclagem em vez de responder: ${resultado.slice(0, 100)}`);
    }
    return resultado;
  } catch (erro) {
    console.error(`[ERRO] Falha ao mesclar grupo de notícias: ${erro}`);
    return itensDoGrupo.reduce((maior, item) => ((item.resumo?.length ?? 0) > (maior.resumo?.length ?? 0) ? item : maior))
      .resumo ?? "";
  }
}

function montarNoticiaMesclada(itensDoGrupo: NoticiaUnificavel[], resumoMesclado: string): NoticiaUnificavel {
  // Só Rádio/TV chega aqui (Online nunca é unificado) — não precisa tratar
  // múltiplos links.
  const veiculos = [...new Set(itensDoGrupo.map((i) => i.veiculo))].sort();
  return {
    ...itensDoGrupo[0],
    veiculo: veiculos.join(", "),
    resumo: resumoMesclado,
    id: itensDoGrupo
      .map((i) => i.id)
      .sort()
      .join("+"),
  };
}

export async function unificarNoticias(
  noticias: NoticiaUnificavel[],
  personagem: string,
): Promise<NoticiaUnificavel[]> {
  const elegiveis = filtrarElegiveis(noticias);
  const idsElegiveis = new Set(elegiveis.map((n) => n.id));
  const naoElegiveis = noticias.filter((n) => !idsElegiveis.has(n.id));

  // Só Rádio/TV passa pela fusão via IA — Online nunca é unificado.
  const paraMesclar = elegiveis.filter((n) => n.tipoVeiculo === "Rádio" || n.tipoVeiculo === "Televisão");
  const idsParaMesclar = new Set(paraMesclar.map((n) => n.id));
  const onlineElegivel = elegiveis.filter((n) => !idsParaMesclar.has(n.id));

  const baldes = new Map<string, NoticiaUnificavel[]>();
  for (const n of paraMesclar) {
    const chave = bucketKey(n);
    baldes.set(chave, [...(baldes.get(chave) ?? []), n]);
  }

  const resultado: NoticiaUnificavel[] = [...naoElegiveis, ...onlineElegivel];

  for (const itens of baldes.values()) {
    const grupos = await agruparPorSimilaridade(itens, personagem);

    for (const grupoIndices of grupos) {
      const itensDoGrupo = grupoIndices.map((i) => itens[i]);

      if (itensDoGrupo.length === 1) {
        resultado.push(itensDoGrupo[0]);
        continue;
      }

      const resumoMesclado = await mesclarGrupo(itensDoGrupo, personagem);
      resultado.push(montarNoticiaMesclada(itensDoGrupo, resumoMesclado));
    }
  }

  return resultado;
}
