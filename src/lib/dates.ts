/** Formata uma data "YYYY-MM-DD" (como é guardada/comparada internamente)
 * para exibição no padrão brasileiro "DD-MM-AAAA". */
export function formatarDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}-${mes}-${ano}`;
}
