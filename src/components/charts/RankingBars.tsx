/** Ranking horizontal de série única (nominal) — todas as barras na mesma
 * cor (slot categórico 1), a posição/comprimento é quem carrega a
 * informação, não a cor. */
export function RankingBars({ dados }: { dados: { nome: string; valor: number }[] }) {
  if (dados.length === 0) {
    return <p className="text-sm italic text-[var(--muted-foreground)]">Nenhum registro no período.</p>;
  }

  const maxValor = Math.max(1, ...dados.map((d) => d.valor));

  return (
    <div className="space-y-2">
      {dados.map((d) => (
        <div key={d.nome} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-right text-[var(--muted-foreground)]" title={d.nome}>
            {d.nome}
          </span>
          <div className="h-4 bg-transparent">
            <div
              className="h-4 rounded-r-[4px] bg-[var(--chart-1)]"
              style={{ width: `${(d.valor / maxValor) * 100}%` }}
            />
          </div>
          <span className="tabular-nums text-[var(--foreground)]">{d.valor}</span>
        </div>
      ))}
    </div>
  );
}
