/**
 * Porta de horarios.py, com os intervalos definidos pela usuária (não os
 * provisórios do PDF) — 4 janelas cobrindo o dia inteiro sem sobreposição:
 * - 09h30 cobre o residual da noite anterior (17h–23h59 do dia anterior)
 * - 08h cobre a madrugada/manhã cedo (00h–08h do próprio dia)
 * - 14h cobre o restante da manhã (08h–14h)
 * - 18h cobre a tarde (14h–18h)
 *
 * Cálculo feito em UTC explícito (Date.UTC), NUNCA usando o fuso horário
 * do processo Node — em produção (Vercel) o servidor roda em UTC, não em
 * horário de Brasília, então usar new Date(...).setHours() daria as
 * janelas erradas por causa do fuso. Brasília é UTC-3 fixo (sem horário
 * de verão desde 2019), então somamos 3h a cada hora "local" pra achar o
 * instante UTC equivalente.
 */

export const HORARIOS = ["08h", "09h30", "14h", "18h"] as const;
export type Horario = (typeof HORARIOS)[number];

const OFFSET_BRASILIA_HORAS = 3;

function instanteBrasilia(ano: number, mes: number, dia: number, hora: number, minuto: number, segundo: number): Date {
  return new Date(Date.UTC(ano, mes - 1, dia, hora + OFFSET_BRASILIA_HORAS, minuto, segundo));
}

/** `dataBase` é o dia do disparo, "YYYY-MM-DD" no calendário de Brasília. */
export function calcularPeriodo(dataBase: string, horario: Horario): { inicio: Date; fim: Date } {
  const [ano, mes, dia] = dataBase.split("-").map(Number);

  // Data do dia anterior calculada via UTC puro (Date.UTC normaliza
  // automaticamente virada de mês/ano quando dia-1 é 0).
  const anterior = new Date(Date.UTC(ano, mes - 1, dia - 1));
  const anoAnt = anterior.getUTCFullYear();
  const mesAnt = anterior.getUTCMonth() + 1;
  const diaAnt = anterior.getUTCDate();

  switch (horario) {
    case "08h":
      return { inicio: instanteBrasilia(ano, mes, dia, 0, 0, 0), fim: instanteBrasilia(ano, mes, dia, 8, 0, 0) };
    case "09h30":
      return {
        inicio: instanteBrasilia(anoAnt, mesAnt, diaAnt, 17, 0, 0),
        fim: instanteBrasilia(anoAnt, mesAnt, diaAnt, 23, 59, 59),
      };
    case "14h":
      return { inicio: instanteBrasilia(ano, mes, dia, 8, 0, 0), fim: instanteBrasilia(ano, mes, dia, 14, 0, 0) };
    case "18h":
      return { inicio: instanteBrasilia(ano, mes, dia, 14, 0, 0), fim: instanteBrasilia(ano, mes, dia, 18, 0, 0) };
  }
}
