"use server";

import { requireUserId } from "@/lib/dal";
import { calcularRelatorioSemanal } from "@/server/queries/relatorio";
import { gerarRelatorioDocx } from "@/lib/relatorioDocx";
import { gerarRelatorioPdf } from "@/lib/relatorioPdf";
import type { RelatorioSemanal } from "@/lib/relatorioSemanal";

export async function calcularRelatorioAction(
  inicio: string,
  fim: string,
): Promise<{ ok: true; relatorio: RelatorioSemanal } | { ok: false; message: string }> {
  await requireUserId();
  if (!inicio || !fim) return { ok: false, message: "Período inválido." };

  const relatorio = await calcularRelatorioSemanal(inicio, fim);
  return { ok: true, relatorio };
}

export async function baixarRelatorioAction(
  inicio: string,
  fim: string,
  formato: "docx" | "pdf",
): Promise<
  | { ok: true; arquivoBase64: string; filename: string; mimeType: string }
  | { ok: false; message: string }
> {
  await requireUserId();
  if (!inicio || !fim) return { ok: false, message: "Período inválido." };

  const relatorio = await calcularRelatorioSemanal(inicio, fim);

  const buffer =
    formato === "docx" ? await gerarRelatorioDocx(relatorio) : await gerarRelatorioPdf(relatorio);

  const mimeType =
    formato === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

  return {
    ok: true,
    arquivoBase64: buffer.toString("base64"),
    filename: `relatorio_pmjp_${inicio}_a_${fim}.${formato}`,
    mimeType,
  };
}
