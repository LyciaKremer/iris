import "server-only";
import { prisma } from "@/lib/prisma";

export type Localizacao = { cidade: string; regiao: string };

const DESCONHECIDA: Localizacao = { cidade: "Desconhecida", regiao: "Desconhecida" };

/**
 * Porta de localizacao.py — carrega o mapa inteiro de uma vez (em vez de
 * uma query por notícia) pra usar em relatórios/gráficos que iteram
 * centenas de registros. Veículos não mapeados caem em "Desconhecida".
 */
export async function carregarMapaLocalizacoes(): Promise<Map<string, Localizacao>> {
  const linhas = await prisma.veiculoLocalizacao.findMany();
  return new Map(linhas.map((l) => [l.veiculo, { cidade: l.cidade, regiao: l.regiao }]));
}

export function obterLocalizacao(mapa: Map<string, Localizacao>, veiculo: string): Localizacao {
  return mapa.get(veiculo.trim()) ?? DESCONHECIDA;
}
