/**
 * Porta de horarios.py, com os intervalos definidos pela usuária (não os
 * provisórios do PDF) — 4 janelas cobrindo o dia inteiro sem sobreposição:
 * - 09h30 cobre o residual da noite anterior (17h–23h59 do dia anterior)
 * - 08h cobre a madrugada/manhã cedo (00h–08h do próprio dia)
 * - 14h cobre o restante da manhã (08h–14h)
 * - 18h cobre a tarde (14h–18h)
 *
 * Grade da PMJP (instituição) — sem filtro de tipo de veículo, todos os
 * tipos monitorados (Rádio/TV) aparecem em qualquer horário.
 *
 * Cálculo feito em UTC explícito (Date.UTC), NUNCA usando o fuso horário
 * do processo Node — em produção (Vercel) o servidor roda em UTC, não em
 * horário de Brasília, então usar new Date(...).setHours() daria as
 * janelas erradas por causa do fuso. Brasília é UTC-3 fixo (sem horário
 * de verão desde 2019), então somamos 3h a cada hora "local" pra achar o
 * instante UTC equivalente.
 */

export const HORARIOS_INSTITUICAO = ["08h", "09h30", "14h", "18h"] as const;
export type HorarioInstituicao = (typeof HORARIOS_INSTITUICAO)[number];

/**
 * Grade dos candidatos (pessoa) — porta de alertas-wpp/horarios.py: cada
 * horário amarra também um tipo de veículo fixo (CONFIG_HORARIOS), porque
 * historicamente cada disparo daquele horário só levava um tipo.
 */
export const HORARIOS_PESSOA = ["9h", "14h", "14h30", "17h"] as const;
export type HorarioPessoa = (typeof HORARIOS_PESSOA)[number];

export const TIPO_POR_HORARIO_PESSOA: Record<HorarioPessoa, string> = {
  "9h": "Rádio",
  "14h": "Rádio",
  "14h30": "Televisão",
  "17h": "Online",
};

export type Horario = HorarioInstituicao | HorarioPessoa;

export function horariosPorTipo(tipoCandidato: "pessoa" | "instituicao"): readonly Horario[] {
  return tipoCandidato === "instituicao" ? HORARIOS_INSTITUICAO : HORARIOS_PESSOA;
}

/** União dos rótulos das duas grades, em ordem cronológica de cobertura —
 * usado pelo processamento em lote (vários candidatos, possivelmente de
 * tipos diferentes, numa tela só). "14h" existe nas duas grades (com
 * janelas diferentes, resolvidas por calcularPeriodo a partir do tipo de
 * cada candidato), então aparece uma única vez aqui. */
export const TODOS_HORARIOS: readonly Horario[] = ["08h", "09h30", "9h", "14h", "14h30", "17h", "18h"];

export function horarioValidoPara(horario: Horario, tipoCandidato: "pessoa" | "instituicao"): boolean {
  return (horariosPorTipo(tipoCandidato) as readonly string[]).includes(horario);
}

/**
 * Descobre a qual horário de disparo uma notícia pertence, dada sua
 * `dataPublicacao` — o inverso de calcularPeriodo(). Usado pelo filtro da
 * tela de Revisar, pra explicar por que uma notícia aparece (ou não) num
 * export específico sem precisar abrir o "Exportar" pra descobrir: cada
 * horário tem uma janela fixa de data/hora (não "o que foi importado
 * hoje"), então duas notícias importadas juntas podem cair em horários
 * diferentes. Retorna null se a data de publicação não cair em nenhuma
 * janela da grade (não deveria acontecer, mas evita lançar erro na tela). */
export function horarioDeNoticia(
  dataPublicacao: Date,
  dataBase: string,
  tipoCandidato: "pessoa" | "instituicao",
): Horario | null {
  for (const horario of horariosPorTipo(tipoCandidato)) {
    const { inicio, fim } = calcularPeriodo(dataBase, horario, tipoCandidato);
    if (dataPublicacao >= inicio && dataPublicacao <= fim) return horario;
  }
  return null;
}

const OFFSET_BRASILIA_HORAS = 3;

function instanteBrasilia(ano: number, mes: number, dia: number, hora: number, minuto: number, segundo: number): Date {
  return new Date(Date.UTC(ano, mes - 1, dia, hora + OFFSET_BRASILIA_HORAS, minuto, segundo));
}

function diaAnterior(ano: number, mes: number, dia: number): { ano: number; mes: number; dia: number } {
  // Data do dia anterior calculada via UTC puro (Date.UTC normaliza
  // automaticamente virada de mês/ano quando dia-1 é 0).
  const anterior = new Date(Date.UTC(ano, mes - 1, dia - 1));
  return { ano: anterior.getUTCFullYear(), mes: anterior.getUTCMonth() + 1, dia: anterior.getUTCDate() };
}

function calcularPeriodoInstituicao(ano: number, mes: number, dia: number, horario: HorarioInstituicao): { inicio: Date; fim: Date } {
  switch (horario) {
    case "08h":
      return { inicio: instanteBrasilia(ano, mes, dia, 0, 0, 0), fim: instanteBrasilia(ano, mes, dia, 8, 0, 0) };
    case "09h30": {
      const ant = diaAnterior(ano, mes, dia);
      return {
        inicio: instanteBrasilia(ant.ano, ant.mes, ant.dia, 17, 0, 0),
        fim: instanteBrasilia(ant.ano, ant.mes, ant.dia, 23, 59, 59),
      };
    }
    case "14h":
      return { inicio: instanteBrasilia(ano, mes, dia, 8, 0, 0), fim: instanteBrasilia(ano, mes, dia, 14, 0, 0) };
    case "18h":
      return { inicio: instanteBrasilia(ano, mes, dia, 14, 0, 0), fim: instanteBrasilia(ano, mes, dia, 18, 0, 0) };
  }
}

// Grade pessoa (candidatos) — janelas portadas de alertas-wpp/horarios.py
// (calcular_periodo), mesma semântica: "tarde/noite anterior" pro 9h, "dia
// atual" pro 14h/17h, "noite anterior + dia atual" pro 14h30. O "até agora"
// do script Python vira "até 23:59:59" aqui — a exportação é sob demanda,
// não há notícia com data futura à data de publicação real de qualquer forma.
function calcularPeriodoPessoa(ano: number, mes: number, dia: number, horario: HorarioPessoa): { inicio: Date; fim: Date } {
  switch (horario) {
    case "9h": {
      const ant = diaAnterior(ano, mes, dia);
      return {
        inicio: instanteBrasilia(ant.ano, ant.mes, ant.dia, 12, 0, 0),
        fim: instanteBrasilia(ant.ano, ant.mes, ant.dia, 23, 59, 59),
      };
    }
    case "14h":
      return { inicio: instanteBrasilia(ano, mes, dia, 0, 0, 0), fim: instanteBrasilia(ano, mes, dia, 23, 59, 59) };
    case "14h30": {
      const ant = diaAnterior(ano, mes, dia);
      return {
        inicio: instanteBrasilia(ant.ano, ant.mes, ant.dia, 17, 0, 0),
        fim: instanteBrasilia(ano, mes, dia, 23, 59, 59),
      };
    }
    case "17h":
      return { inicio: instanteBrasilia(ano, mes, dia, 0, 0, 0), fim: instanteBrasilia(ano, mes, dia, 23, 59, 59) };
  }
}

/**
 * `dataBase` é o dia do disparo, "YYYY-MM-DD" no calendário de Brasília.
 * `tipoCandidato` é OBRIGATÓRIO pra desambiguar — "14h" existe nas duas
 * grades com janelas diferentes (instituição: 08h-14h; pessoa: dia
 * inteiro), então o rótulo do horário sozinho não basta.
 */
export function calcularPeriodo(
  dataBase: string,
  horario: Horario,
  tipoCandidato: "pessoa" | "instituicao",
): { inicio: Date; fim: Date } {
  const [ano, mes, dia] = dataBase.split("-").map(Number);

  return tipoCandidato === "instituicao"
    ? calcularPeriodoInstituicao(ano, mes, dia, horario as HorarioInstituicao)
    : calcularPeriodoPessoa(ano, mes, dia, horario as HorarioPessoa);
}
