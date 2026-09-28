"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/validations";

/**
 * Porta de atualizar_localizacoes.py — em vez de ler uma planilha .xlsx
 * (sem disco persistente no Vercel pra isso), recebe as linhas coladas
 * como texto separado por ponto-e-vírgula ou vírgula:
 * Veículo;Cidade-sede;Região;Tipo (Tipo é opcional).
 * Upsert por veículo — atualizar a planilha corrige o histórico inteiro,
 * já que a localização é um lookup dinâmico, não gravada na Noticia.
 */
export async function importarLocalizacoesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUserId();

  const texto = String(formData.get("texto") ?? "").trim();
  if (!texto) return { ok: false, message: "Cole as linhas da planilha." };

  const linhas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  const separador = linhas[0]?.includes(";") ? ";" : ",";

  let importadas = 0;
  const erros: string[] = [];

  for (const linha of linhas) {
    const colunas = linha.split(separador).map((c) => c.trim());
    const [veiculo, cidade, regiao, tipoFonte] = colunas;

    if (!veiculo || !cidade || !regiao) {
      erros.push(linha);
      continue;
    }

    await prisma.veiculoLocalizacao.upsert({
      where: { veiculo },
      update: { cidade, regiao, tipoFonte: tipoFonte || null },
      create: { veiculo, cidade, regiao, tipoFonte: tipoFonte || null },
    });
    importadas++;
  }

  revalidatePath("/localizacoes");

  if (erros.length > 0) {
    return {
      ok: false,
      message: `${importadas} importada(s), mas ${erros.length} linha(s) sem veículo/cidade/região válidos (formato: Veículo;Cidade;Região;Tipo).`,
    };
  }

  return { ok: true, message: `${importadas} veículo(s) mapeado(s).` };
}

export async function removerLocalizacaoAction(veiculo: string): Promise<{ ok: boolean; message?: string }> {
  await requireUserId();
  if (!veiculo) return { ok: false, message: "Veículo não identificado." };

  await prisma.veiculoLocalizacao.delete({ where: { veiculo } });
  revalidatePath("/localizacoes");
  return { ok: true };
}
