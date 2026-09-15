/** Formata uma data "YYYY-MM-DD" (como é guardada/comparada internamente)
 * para exibição no padrão brasileiro "DD/MM/AAAA". */
export function formatarDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

/** Formata um Date (instante) com data e hora no fuso de Brasília,
 * independente do fuso do navegador/servidor — usado pra conferir em
 * qual janela de horário (08h/09h30/14h/18h) uma notícia cai. */
export function formatarDataHoraBR(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}
