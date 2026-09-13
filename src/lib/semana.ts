/** Calcula a segunda-feira e a sexta-feira da semana que contém a data de
 * referência informada (formato "YYYY-MM-DD") — não assume que a
 * referência já é uma sexta-feira, funciona pra qualquer dia escolhido. */
export function calcularSemanaUtil(referenciaIso: string): { inicio: string; fim: string } {
  const referencia = new Date(`${referenciaIso}T00:00:00`);
  const diaDaSemana = referencia.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado

  // Distância até a segunda-feira anterior (ou a própria, se já for segunda).
  // Domingo (0) é tratado como fazendo parte da semana que TERMINOU na
  // sexta anterior, não da que começa no dia seguinte.
  const deltaParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;

  const segunda = new Date(referencia);
  segunda.setDate(segunda.getDate() + deltaParaSegunda);

  const sexta = new Date(segunda);
  sexta.setDate(sexta.getDate() + 4);

  return { inicio: paraIso(segunda), fim: paraIso(sexta) };
}

function paraIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}
