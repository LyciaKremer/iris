export type ItemChecklist = { chave: string; label: string; apenasSexta?: boolean };

/** Itens fixos do checklist diário — os 4 envios da PMJP, o upload de
 * mídia, e o relatório semanal (só relevante às sextas). */
export const ITENS_CHECKLIST: ItemChecklist[] = [
  { chave: "envio_08h", label: "Envio das 08h" },
  { chave: "envio_0930", label: "Envio das 09h30" },
  { chave: "envio_14h", label: "Envio das 14h" },
  { chave: "envio_18h", label: "Envio das 18h" },
  { chave: "upload_midia", label: "Upload dos arquivos de mídia" },
  { chave: "envio_relatorio", label: "Envio do relatório semanal", apenasSexta: true },
];

export function itensDoDia(dataIso: string): ItemChecklist[] {
  const ehSexta = new Date(`${dataIso}T00:00:00`).getDay() === 5;
  return ITENS_CHECKLIST.filter((item) => !item.apenasSexta || ehSexta);
}
