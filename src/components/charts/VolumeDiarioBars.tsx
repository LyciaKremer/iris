/** Barras verticais (CSS flex, cresce a partir da base) — volume diário,
 * com dias de pico destacados usando o mesmo token de "negativo" (mesma
 * semântica de alerta usada em outro lugar do app). */
export function VolumeDiarioBars({ dados }: { dados: { rotulo: string; valor: number; destaque: boolean }[] }) {
  if (dados.length === 0) {
    return <p className="text-sm italic text-[var(--muted-foreground)]">Nenhum registro no período.</p>;
  }

  const maxValor = Math.max(1, ...dados.map((d) => d.valor));
  const passoRotulo = dados.length > 10 ? Math.ceil(dados.length / 10) : 1;

  return (
    <div className="flex h-40 items-end gap-1">
      {dados.map((d, i) => (
        <div key={d.rotulo} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t-[4px]"
            style={{
              height: `${(d.valor / maxValor) * 100}%`,
              background: d.destaque ? "var(--negative)" : "var(--chart-1)",
            }}
            title={`${d.rotulo}: ${d.valor}${d.destaque ? " (pico)" : ""}`}
          />
          {i % passoRotulo === 0 && (
            <span className="text-[9px] text-[var(--muted-foreground)]">{d.rotulo.slice(5)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
