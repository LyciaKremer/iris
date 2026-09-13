/**
 * Reconstrói o formato de export da plataforma de clipping (o que
 * clipping.py/carregar_clipping lê e mergeJson.py mescla) a partir das
 * notícias já salvas no Iris — pra permitir "devolver" a base acumulada
 * aqui pro pipeline local (mergeJson.py / baixar_midias.py).
 *
 * Alguns campos do vendor original (language, location, isFavorited,
 * expressions) não são armazenados pelo Iris — não são usados por nenhuma
 * lógica de negócio real, só por estatísticas agregadas que o próprio
 * mergeJson.py recalcula do zero a cada execução. Preenchidos aqui com
 * valores neutros só pra não quebrar o `item["campo"]` (indexação direta,
 * sem .get()) que mergeJson.py faz sobre esses três.
 */

export type NoticiaParaVendorExport = {
  noticiaId: string;
  veiculo: string;
  tipoVeiculo: string;
  tituloOriginal: string;
  transcricao: string | null;
  urlMidia: string | null;
  sentimentoOriginal: string;
  dataPublicacao: Date;
};

function sentimentoParaIngles(sentimento: string): string {
  const mapa: Record<string, string> = {
    Positivo: "positive",
    Negativo: "negative",
    Neutro: "neutral",
  };
  return mapa[sentimento] ?? "neutral";
}

export function montarExportVendor(noticias: NoticiaParaVendorExport[], clippingName: string) {
  const items = noticias.map((n) => ({
    id: n.noticiaId,
    sourceName: n.veiculo,
    vehicleTypeName: n.tipoVeiculo,
    title: n.tituloOriginal,
    content: n.transcricao ?? "",
    url: n.urlMidia,
    publishedDate: n.dataPublicacao.toISOString(),
    sentimentAnalisys: { sentence: sentimentoParaIngles(n.sentimentoOriginal) },
    language: "pt-BR",
    location: null as string | null,
    isFavorited: false,
    expressions: [] as string[],
    searchedExpressions: [] as string[],
  }));

  return {
    result: {
      clippingName,
      items,
      collectionSize: items.length,
      totalItems: items.length,
      vehicles: [],
      languages: [],
      locations: [],
      favorites: [],
      vehicleTypes: [],
      expressions: [],
      tags: [],
      mediaVehicleAudiences: null,
    },
  };
}
