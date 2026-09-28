const CORES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

/** Donut via conic-gradient (CSS puro, sem canvas/SVG) — até 3 fatias
 * (Rádio/Televisão/Online), a paleta categórica valida "all-pairs" nos
 * 3 primeiros slots (qualquer duas fatias podem ficar lado a lado). */
export function TipoVeiculoDonut({ dados }: { dados: { nome: string; valor: number }[] }) {
  if (dados.length === 0) {
    return <p className="text-sm italic text-[var(--muted-foreground)]">Nenhum registro no período.</p>;
  }

  const total = dados.reduce((s, d) => s + d.valor, 0) || 1;

  const acumulados = dados.reduce<number[]>((acc, d) => {
    const anterior = acc.length ? acc[acc.length - 1] : 0;
    acc.push(anterior + d.valor);
    return acc;
  }, []);

  const stops = dados.map((d, i) => {
    const inicio = ((acumulados[i] - d.valor) / total) * 360;
    const fim = (acumulados[i] / total) * 360;
    return `${CORES[i % CORES.length]} ${inicio}deg ${fim}deg`;
  });

  return (
    <div className="flex items-center gap-6">
      <div
        className="h-40 w-40 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${stops.join(", ")})`,
          mask: "radial-gradient(farthest-side, transparent calc(100% - 28px), #000 calc(100% - 28px))",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 28px), #000 calc(100% - 28px))",
        }}
      />
      <div className="space-y-1.5 text-sm">
        {dados.map((d, i) => (
          <div key={d.nome} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CORES[i % CORES.length] }} />
            <span className="text-[var(--foreground)]">{d.nome}</span>
            <span className="tabular-nums text-[var(--muted-foreground)]">
              {d.valor} ({Math.round((d.valor / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
