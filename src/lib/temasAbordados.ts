import "server-only";
import { askClaude } from "@/lib/anthropic";
import { filtrarElegiveis, type NoticiaUnificavel } from "@/lib/unificador";

/**
 * Porta de assuntos.py + relatorio.py (alertas-wpp) — a mensagem extra de
 * fechamento do disparo, listando os assuntos abordados por sentimento com
 * uma manchete curta gerada por IA. Sem cache de títulos (mesma decisão de
 * unificador.ts): a exportação é sob demanda, não um script agendado.
 */

const EMOJI_SENTIMENTO: Record<string, string> = { Positivo: "🟢", Negativo: "🔴", Neutro: "🔵" };
const EMOJI_TIPO: Record<string, string> = { Rádio: "📻", Televisão: "📺", Online: "🌐" };
const ORDEM_TIPOS = ["Rádio", "Televisão", "Online"];
const ORDEM_SENTIMENTOS = ["Negativo", "Neutro", "Positivo"];

function tituloFallback(item: NoticiaUnificavel): string {
  const texto = item.resumo || "Sem título.";
  const limite = 80;
  return texto.length <= limite ? texto : texto.slice(0, limite).trimEnd() + "...";
}

function extrairJson(resposta: string): unknown {
  const semFences = resposta.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(semFences);
}

async function gerarTitulos(itens: NoticiaUnificavel[], personagem: string): Promise<string[]> {
  if (itens.length === 0) return [];

  const lista = itens.map((item, i) => `[${i}] ${item.resumo}`).join("\n");

  const prompt = `Você é um editor de clipping político. Abaixo está uma lista de resumos de notícias sobre ${personagem}, cada um já representando um assunto/fato distinto.

Para cada resumo, dê um título curto e específico (até 10 palavras), no estilo de manchete editorial, capturando o fato concreto — não uma categoria genérica.

Resumos:
${lista}

Responda APENAS com um JSON no formato {"titulos": [{"indice": <mesmo índice mostrado entre colchetes acima>, "titulo": "..."}, ...]}, com uma entrada pra cada índice listado.`;

  const maxTokens = Math.min(4096, 150 + 50 * itens.length);

  try {
    const resposta = await askClaude(prompt, maxTokens);
    const resultado = (extrairJson(resposta) as { titulos: { indice: number; titulo: string }[] }).titulos;

    const indicesRecebidos = resultado.map((r) => r.indice).sort((a, b) => a - b);
    const indicesEsperados = itens.map((_, i) => i);
    if (JSON.stringify(indicesRecebidos) !== JSON.stringify(indicesEsperados)) {
      throw new Error("Títulos retornados não cobrem todos os índices.");
    }

    const tituloPorIndice = new Map(resultado.map((r) => [r.indice, r.titulo]));
    return itens.map((item, i) => tituloPorIndice.get(i) ?? tituloFallback(item));
  } catch (erro) {
    console.error(`[ERRO] Falha ao gerar títulos dos assuntos: ${erro}`);
    return itens.map(tituloFallback);
  }
}

function qtdVeiculos(n: NoticiaUnificavel): number {
  return n.veiculo.split(", ").length;
}

/** Monta o rótulo de tipo(s) de veículo pro cabeçalho — na maioria dos
 * casos é um único tipo (cada horário só processa um tipo por vez pra
 * candidatos pessoa); lista todos os presentes quando há mais de um
 * (instituição, que mistura Rádio+TV no mesmo horário). */
function rotuloTipos(elegiveis: NoticiaUnificavel[]): string {
  const tiposPresentes = new Set(elegiveis.map((n) => n.tipoVeiculo));
  const tiposOrdenados = ORDEM_TIPOS.filter((t) => tiposPresentes.has(t));
  return tiposOrdenados.map((t) => `${EMOJI_TIPO[t] ?? "📰"} ${t.toUpperCase()}`).join(" / ");
}

/**
 * Monta o texto do relatório de temas abordados pro fim do disparo, a
 * partir da lista já unificada (unificador.ts). Retorna null quando não há
 * conteúdo suficiente (menos de 2 assuntos elegíveis no disparo).
 */
export async function gerarRelatorioTemas(
  noticiasUnificadas: NoticiaUnificavel[],
  personagem: string,
  horario: string,
): Promise<string | null> {
  const elegiveis = filtrarElegiveis(noticiasUnificadas);
  if (elegiveis.length < 2) return null;

  const titulos = await gerarTitulos(elegiveis, personagem);

  const baldes = new Map<string, [string, number][]>();
  elegiveis.forEach((n, i) => {
    const sentimento = n.sentimentoFinal ?? n.sentimentoOriginal;
    const lista = baldes.get(sentimento) ?? [];
    lista.push([titulos[i], qtdVeiculos(n)]);
    baldes.set(sentimento, lista);
  });

  const rotulo = rotuloTipos(elegiveis);
  let texto = `📈 RESUMO DO ALERTAS — ${rotulo} — ${horario}\n━━━━━━━━━━━━━━━━━━━━\n\nTemas abordados no monitoramento\n`;
  let algumAssunto = false;

  for (const sentimento of ORDEM_SENTIMENTOS) {
    const itens = baldes.get(sentimento);
    if (!itens) continue;

    itens.sort((a, b) => b[1] - a[1]);

    const emoji = EMOJI_SENTIMENTO[sentimento] ?? "⚪";
    texto += `\n${emoji} ${sentimento}:\n`;
    for (const [titulo, qtd] of itens) texto += `• ${titulo} (${qtd})\n`;
    algumAssunto = true;
  }

  if (!algumAssunto) return null;
  return texto.trim();
}
