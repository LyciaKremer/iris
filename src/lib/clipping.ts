import { z } from "zod";

/**
 * Porta de clipping.py (carregar_clipping / normalizar_sentimento) — em vez
 * de ler um caminho de arquivo, recebe o JSON já parseado do upload feito
 * na tela de importação. Mesmo formato de export que `mergeJson.py` produz
 * hoje em `dados/prefeitura.json`.
 */

const itemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  sourceName: z.string(),
  vehicleTypeName: z.string(),
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  publishedDate: z.string(),
  sentimentAnalisys: z
    .object({ sentence: z.string().nullable().optional() })
    .nullable()
    .optional(),
});

const exportSchema = z.object({
  result: z.object({
    clippingName: z.string(),
    items: z.array(itemSchema),
  }),
});

export type NoticiaBruta = {
  noticiaId: string;
  veiculo: string;
  tipoVeiculo: string;
  tituloOriginal: string;
  transcricao: string | null;
  urlMidia: string | null;
  linkDireto: string | null;
  sentimentoOriginal: string;
  dataPublicacao: Date;
  personagem: string;
};

function normalizarSentimento(sentimento: string | null | undefined): string {
  const mapa: Record<string, string> = {
    positive: "Positivo",
    negative: "Negativo",
    neutral: "Neutro",
  };
  return mapa[sentimento ?? ""] ?? "Neutro";
}

export type ClippingParseError = { erro: string };

export function parseClippingExport(
  json: unknown,
): { personagem: string; itens: NoticiaBruta[] } | ClippingParseError {
  const parsed = exportSchema.safeParse(json);
  if (!parsed.success) {
    return { erro: "Formato do export não reconhecido. Confira se é o JSON gerado pelo mergeJson.py." };
  }

  const { clippingName, items } = parsed.data.result;

  const itens: NoticiaBruta[] = items.map((item) => {
    const tipoVeiculo = item.vehicleTypeName;
    return {
      noticiaId: String(item.id),
      veiculo: item.sourceName,
      tipoVeiculo,
      tituloOriginal: item.title ?? "",
      transcricao: item.content ?? null,
      // URL Mídia é sempre `url`, independente do tipo — usado pra download de mídia.
      urlMidia: item.url ?? null,
      // Link direto só existe pra Online (Rádio/TV usam `urlMidia` pra baixar o áudio/vídeo).
      linkDireto: tipoVeiculo === "Online" ? (item.url ?? null) : null,
      sentimentoOriginal: normalizarSentimento(item.sentimentAnalisys?.sentence),
      dataPublicacao: new Date(item.publishedDate),
      personagem: clippingName,
    };
  });

  return { personagem: clippingName, itens };
}
