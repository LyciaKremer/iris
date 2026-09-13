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

export function montarMensagens(noticias: NoticiaParaEnvio[]): string[] {
  const grupos: Record<string, Record<string, NoticiaParaEnvio[]>> = {};

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

  const mensagens: string[] = [];

  for (const tipo of ORDEM_TIPOS) {
    if (!grupos[tipo]) continue;

    for (const sentimento of ORDEM_SENTIMENTOS) {
      const itens = grupos[tipo][sentimento];
      if (!itens) continue;

      const emoji = EMOJI_SENTIMENTO[sentimento] ?? "⚪";

      if (sentimento === "Negativo") {
        for (const n of itens) {
          const secretaria = n.secretaria ?? "Outro";
          const resumo = n.resumo || "Sem clipping.";
          mensagens.push(`${emoji} ${n.veiculo} - ${secretaria} - ${resumo}`);
        }
        continue;
      }

      const linhas = itens.map((n) => {
        const secretaria = n.secretaria ?? "Outro";
        const resumo = n.resumo || "Sem clipping.";
        return `${emoji} ${n.veiculo}: ${secretaria} - ${resumo}`;
      });
      mensagens.push(linhas.join("\n\n"));
    }
  }

  return mensagens;
}
