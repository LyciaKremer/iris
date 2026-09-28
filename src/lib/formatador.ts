import { SECRETARIA_COMERCIAL } from "@/lib/secretaria";

/**
 * Porta de montar_mensagens() (formatador.py). Regras preservadas:
 * - Ordem fixa: tipo (Rádio → Televisão → Online) e, dentro de cada tipo,
 *   sentimento (Negativo → Neutro → Positivo).
 * - Negativas NUNCA são agrupadas — cada uma vira sua própria mensagem.
 * - Positivas/neutras do mesmo (tipo, sentimento) são juntadas numa mensagem só.
 * - Comercial/publicidade paga nunca vira alerta.
 * - Rádio/Televisão com relevante===false ficam de fora (Online é sempre elegível).
 */

const EMOJI_SENTIMENTO: Record<string, string> = {
  Positivo: "🟢",
  Negativo: "🔴",
  Neutro: "🔵",
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

/** Uma mensagem por notícia (negativas nunca são agrupadas) ou uma
 * mensagem só juntando todas as notícias do bucket (neutro/positivo). */
function montarMensagensDoBucket(sentimento: string, itens: NoticiaParaEnvio[]): string[] {
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

export function montarMensagens(noticias: NoticiaParaEnvio[]): string[] {
  const grupos = agrupar(noticias);
  const mensagens: string[] = [];

  for (const tipo of ORDEM_TIPOS) {
    if (!grupos[tipo]) continue;

    for (const sentimento of ORDEM_SENTIMENTOS) {
      const itens = grupos[tipo][sentimento];
      if (!itens) continue;
      mensagens.push(...montarMensagensDoBucket(sentimento, itens));
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
export function montarMensagensPorSentimento(noticias: NoticiaParaEnvio[]): Record<string, string[]> {
  const grupos = agrupar(noticias);
  const resultado: Record<string, string[]> = { Negativo: [], Neutro: [], Positivo: [] };

  for (const tipo of ORDEM_TIPOS) {
    if (!grupos[tipo]) continue;

    for (const sentimento of ORDEM_SENTIMENTOS) {
      const itens = grupos[tipo][sentimento];
      if (!itens) continue;
      resultado[sentimento].push(...montarMensagensDoBucket(sentimento, itens));
    }
  }

  return resultado;
}
