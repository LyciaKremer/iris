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

/** Converte um instante (Date) pro "YYYY-MM-DD" do dia correspondente em
 * Brasília — NUNCA usar `data.toISOString().slice(0, 10)` pra isso: isso
 * pega o dia em UTC, que já virou o dia seguinte entre ~21h e meia-noite
 * no horário de Brasília (ex: checklist mostrando o dia errado à noite). */
export function formatarDataISO(data: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return `${mapa.year}-${mapa.month}-${mapa.day}`;
}

/** Data de hoje ("YYYY-MM-DD") no calendário de Brasília. */
export function hojeBR(): string {
  return formatarDataISO(new Date());
}
