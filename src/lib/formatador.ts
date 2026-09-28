import { SECRETARIA_COMERCIAL } from "@/lib/secretaria";
import type { TipoCandidato } from "@/lib/anthropic";

/**
 * Duas formatações bem diferentes, uma por `tipo` de candidato — cada uma
 * preservando o formato que já existia pra ela:
 *
 * - "instituicao" (PMJP): formato original do Iris, de antes da migração
 *   dos candidatos — sem cabeçalho, secretaria aparece no corpo da
 *   mensagem, negativas nunca são agrupadas (cada uma vira sua própria
 *   mensagem).
 * - "pessoa" (candidatos): porta fiel de montar_mensagens()/_montar_mensagem()
 *   (alertas-wpp/formatador.py) — cabeçalho fixo identificando o bloco
 *   (tipo + sentimento), lista numerada de todas as notícias do bloco numa
 *   mensagem só, e SEM tema no corpo (o tema/classificação nunca apareceu
 *   na mensagem em alertas-wpp, só no relatório de assuntos — ver
 *   temasAbordados.ts).
 *
 * Regras comuns aos dois formatos:
 * - Ordem fixa: tipo (Rádio → Televisão → Online) e, dentro de cada tipo,
 *   sentimento (Negativo → Neutro → Positivo).
 * - Comercial/publicidade paga nunca vira alerta.
 * - Rádio/Televisão com relevante===false ficam de fora (Online é sempre elegível).
 */

const EMOJI_SENTIMENTO: Record<string, string> = {
  Positivo: "🟢",
  Negativo: "🔴",
  Neutro: "🔵",
};

const EMOJI_TIPO: Record<string, string> = {
  Rádio: "📻",
  Televisão: "📺",
  Online: "📰",
};

const ORDEM_TIPOS = ["Rádio", "Televisão", "Online"];
const ORDEM_SENTIMENTOS = ["Negativo", "Neutro", "Positivo"];

export type NoticiaParaEnvio = {
  tipoVeiculo: string;
  sentimentoFinal: string | null;
  sentimentoOriginal: string;
  veiculo: string;
  secretaria: string | null;
  resumo: string | null;
  relevante: boolean | null;
  // Só usado no formato "pessoa" (link direto de matéria Online) — porta
  // do campo "Link direto" de alertas-wpp/formatador.py.
  linkDireto?: string | null;
};

type Grupos = Record<string, Record<string, NoticiaParaEnvio[]>>;

function agrupar(noticias: NoticiaParaEnvio[]): Grupos {
  const grupos: Grupos = {};

  for (const noticia of noticias) {
    const tipo = noticia.tipoVeiculo;
    if (tipo !== "Online" && noticia.relevante === false) continue;
    if (noticia.secretaria === SECRETARIA_COMERCIAL) continue;
    if (!ORDEM_TIPOS.includes(tipo)) continue;

    const sentimento = noticia.sentimentoFinal ?? noticia.sentimentoOriginal;
    grupos[tipo] ??= {};
    grupos[tipo][sentimento] ??= [];
    grupos[tipo][sentimento].push(noticia);
  }

  return grupos;
}

/** Formato "instituicao" (PMJP) — inalterado desde antes da migração dos
 * candidatos. Uma mensagem por notícia (negativas) ou uma mensagem só
 * juntando todas as notícias do bucket (neutro/positivo); secretaria
 * aparece no corpo. */
function montarBucketInstituicao(sentimento: string, itens: NoticiaParaEnvio[]): string[] {
  const emoji = EMOJI_SENTIMENTO[sentimento] ?? "⚪";

  if (sentimento === "Negativo") {
    return itens.map((n) => {
      const secretaria = n.secretaria ?? "Outro";
      const resumo = n.resumo || "Sem clipping.";
      return `${emoji} ${n.veiculo} - ${secretaria} - ${resumo}`;
    });
  }

  const linhas = itens.map((n) => {
    const secretaria = n.secretaria ?? "Outro";
    const resumo = n.resumo || "Sem clipping.";
    return `${emoji} ${n.veiculo}: ${secretaria} - ${resumo}`;
  });
  return [linhas.join("\n\n")];
}

/** Formato "pessoa" (candidatos) — porta fiel de _montar_mensagem()
 * (alertas-wpp/formatador.py): UMA mensagem por (tipo, sentimento), com o
 * cabeçalho que identifica o bloco, lista numerada, e sem tema no corpo. */
function montarMensagemPessoa(tipo: string, sentimento: string, itens: NoticiaParaEnvio[]): string {
  const emojiTipo = EMOJI_TIPO[tipo] ?? "📰";
  const emojiSentimento = EMOJI_SENTIMENTO[sentimento] ?? "⚪";

  let mensagem =
    "📊 MONITORAMENTO DE IMPRENSA\n\n" +
    `${emojiTipo} ${tipo.toUpperCase()} - ${emojiSentimento} ${sentimento.toUpperCase()}\n` +
    "━━━━━━━━━━━━━━\n\n";

  itens.forEach((n, i) => {
    const texto = n.resumo || "Sem clipping.";
    mensagem += `${i + 1}. ${emojiSentimento}${emojiTipo} ${n.veiculo} - ${texto}\n`;

    if (tipo === "Online") {
      if (n.linkDireto) mensagem += `🔗 ${n.linkDireto}\n`;
    } else {
      mensagem += "📩 Para mais informações, solicite a mídia na íntegra.\n";
    }

    mensagem += "\n";
  });

  return mensagem;
}

function montarBucket(
  tipo: string,
  sentimento: string,
  itens: NoticiaParaEnvio[],
  tipoCandidato: TipoCandidato,
): string[] {
  return tipoCandidato === "pessoa"
    ? [montarMensagemPessoa(tipo, sentimento, itens)]
    : montarBucketInstituicao(sentimento, itens);
}

export function montarMensagens(noticias: NoticiaParaEnvio[], tipoCandidato: TipoCandidato): string[] {
  const grupos = agrupar(noticias);
  const mensagens: string[] = [];

  for (const tipo of ORDEM_TIPOS) {
    if (!grupos[tipo]) continue;

    for (const sentimento of ORDEM_SENTIMENTOS) {
      const itens = grupos[tipo][sentimento];
      if (!itens) continue;
      mensagens.push(...montarBucket(tipo, sentimento, itens, tipoCandidato));
    }
  }

  return mensagens;
}

/**
 * Mesmo agrupamento de montarMensagens(), mas devolve um dict
 * {sentimento: [mensagens...]} juntando todos os tipos de veículo — usado
 * pela conferência (negativos.txt/neutros.txt/positivos.txt), que é por
 * disparo inteiro, não por tipo de veículo.
 */
export function montarMensagensPorSentimento(
  noticias: NoticiaParaEnvio[],
  tipoCandidato: TipoCandidato,
): Record<string, string[]> {
  const grupos = agrupar(noticias);
  const resultado: Record<string, string[]> = { Negativo: [], Neutro: [], Positivo: [] };

  for (const tipo of ORDEM_TIPOS) {
    if (!grupos[tipo]) continue;

    for (const sentimento of ORDEM_SENTIMENTOS) {
      const itens = grupos[tipo][sentimento];
      if (!itens) continue;
      resultado[sentimento].push(...montarBucket(tipo, sentimento, itens, tipoCandidato));
    }
  }

  return resultado;
}
